import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FormulaType, SimulationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SimulationsService {
  constructor(
    private prisma: PrismaService,
    private vehiclesService: VehiclesService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, data: {
    vehicle: any;
    bonusMalus: number | Decimal;
    usageId: string;
    formulaType: FormulaType;
    conventionId?: string;
    selectedGuarantees?: string[];
    franchiseRate?: number;
    bgLimit?: number;
    dcCapital?: number;
  }) {
    const vehicle = await this.vehiclesService.create(data.vehicle);
    const vehicleAge = this.vehiclesService.calculateVehicleAge(vehicle.firstCirculationDate);

    // Validate age restrictions
    if (data.formulaType === FormulaType.TOUS_RISQUES_0 && vehicleAge >= 2) {
      throw new BadRequestException('Tous Risques 0% is only available for vehicles less than 2 years old');
    }
    if (data.formulaType === FormulaType.DOMMAGES_COLLISIONS && vehicleAge >= 10) {
      throw new BadRequestException('Dommages Collision is only available for vehicles less than 10 years old');
    }

    const simulation = await this.prisma.simulation.create({
      data: {
        userId,
        vehicleId: vehicle.id,
        conventionId: data.conventionId,
        bonusMalus: new Decimal(data.bonusMalus),
        usageId: data.usageId,
        formulaType: data.formulaType,
        franchiseRate: data.franchiseRate ?? null,
        bgLimit: data.bgLimit,
        dcCapital: data.dcCapital ? new Decimal(data.dcCapital) : null,
      },
      include: { vehicle: true },
    });

    // Add selected guarantees
    if (data.selectedGuarantees && data.selectedGuarantees.length > 0) {
      await this.updateGuarantees(simulation.id, data.selectedGuarantees);
    }

    await this.auditService.log(
      userId,
      'SIMULATION_CREATED',
      'Simulation',
      simulation.id,
      null,
      { formulaType: data.formulaType, usageId: data.usageId },
    );

    return this.findById(simulation.id);
  }

  async findByUser(userId: string) {
    return this.prisma.simulation.findMany({
      where: { userId },
      include: {
        vehicle: true,
        convention: { include: { organization: true } },
        guarantees: { include: { guarantee: true } },
        quotes: {
          select: { id: true, quoteNumber: true, status: true, totalAPayer: true, company: { select: { name: true } } },
          orderBy: { totalAPayer: 'asc' },
        },
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const simulation = await this.prisma.simulation.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        convention: { include: { organization: true } },
        guarantees: { include: { guarantee: true } },
        quotes: {
          include: { company: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!simulation) {
      throw new NotFoundException('Simulation not found');
    }

    return simulation;
  }

  async update(id: string, userId: string, data: {
    bonusMalus?: number | Decimal;
    usageId?: string;
    formulaType?: FormulaType;
    conventionId?: string;
    selectedGuarantees?: string[];
    franchiseRate?: number;
    bgLimit?: number;
    dcCapital?: number;
  }) {
    const simulation = await this.findById(id);

    if (simulation.userId !== userId) {
      throw new ForbiddenException('You can only modify your own simulations');
    }

    if (simulation.status !== SimulationStatus.DRAFT) {
      throw new BadRequestException('Cannot modify submitted simulation');
    }

    // Validate formula change with vehicle age
    if (data.formulaType && simulation.vehicle) {
      const vehicleAge = this.vehiclesService.calculateVehicleAge(simulation.vehicle.firstCirculationDate);
      if (data.formulaType === FormulaType.TOUS_RISQUES_0 && vehicleAge >= 2) {
        throw new BadRequestException('Tous Risques 0% is only available for vehicles less than 2 years old');
      }
      if (data.formulaType === FormulaType.DOMMAGES_COLLISIONS && vehicleAge >= 10) {
        throw new BadRequestException('Dommages Collision is only available for vehicles less than 10 years old');
      }
    }

    const updateData: any = {};
    if (data.bonusMalus !== undefined) updateData.bonusMalus = new Decimal(data.bonusMalus);
    if (data.usageId !== undefined) updateData.usageId = data.usageId;
    if (data.formulaType !== undefined) updateData.formulaType = data.formulaType;
    if (data.conventionId !== undefined) updateData.conventionId = data.conventionId;
    if (data.franchiseRate !== undefined) updateData.franchiseRate = data.franchiseRate ?? null;
    if (data.bgLimit !== undefined) updateData.bgLimit = data.bgLimit;
    if (data.dcCapital !== undefined) updateData.dcCapital = data.dcCapital ? new Decimal(data.dcCapital) : null;

    const updated = await this.prisma.simulation.update({
      where: { id },
      data: updateData,
    });

    if (data.selectedGuarantees) {
      await this.updateGuarantees(id, data.selectedGuarantees);
    }

    await this.auditService.log(
      userId,
      'SIMULATION_UPDATED',
      'Simulation',
      id,
      { formulaType: simulation.formulaType },
      { formulaType: updated.formulaType },
    );

    return this.findById(id);
  }

  async updateGuarantees(simulationId: string, guaranteeIds: string[]) {
    await this.prisma.simulationGuarantee.deleteMany({
      where: { simulationId },
    });

    if (guaranteeIds.length > 0) {
      await this.prisma.simulationGuarantee.createMany({
        data: guaranteeIds.map(guaranteeId => ({
          simulationId,
          guaranteeId,
          isSelected: true,
        })),
      });
    }
  }

  async recalculate(id: string, userId: string) {
    const simulation = await this.findById(id);

    if (simulation.userId !== userId) {
      throw new ForbiddenException('You can only recalculate your own simulations');
    }

    if (simulation.status !== SimulationStatus.DRAFT) {
      throw new BadRequestException('Cannot recalculate submitted simulation');
    }

    if (!simulation.vehicle) {
      throw new BadRequestException('Vehicle data not found');
    }
    const vehicleAge = this.vehiclesService.calculateVehicleAge(simulation.vehicle.firstCirculationDate);
    
    // Validate age restrictions
    if (simulation.formulaType === FormulaType.TOUS_RISQUES_0 && vehicleAge >= 2) {
      throw new BadRequestException('Tous Risques 0% is only available for vehicles less than 2 years old');
    }
    if (simulation.formulaType === FormulaType.DOMMAGES_COLLISIONS && vehicleAge >= 10) {
      throw new BadRequestException('Dommages Collision is only available for vehicles less than 10 years old');
    }

    await this.auditService.log(
      userId,
      'SIMULATION_RECALCULATED',
      'Simulation',
      id,
      null,
      { recalculatedAt: new Date() },
    );

    return this.findById(id);
  }

  async submit(id: string, userId: string) {
    const simulation = await this.findById(id);

    if (simulation.userId !== userId) {
      throw new ForbiddenException('You can only submit your own simulations');
    }

    if (simulation.status !== SimulationStatus.DRAFT) {
      throw new BadRequestException('Simulation already submitted');
    }

    const updated = await this.prisma.simulation.update({
      where: { id },
      data: { status: SimulationStatus.SUBMITTED },
    });

    // Submit all quotes associated with this simulation and send notifications
    if (simulation.quotes && simulation.quotes.length > 0) {
      await this.prisma.quote.updateMany({
        where: { 
          simulationId: id,
          status: 'GENERATED'
        },
        data: { status: 'SUBMITTED' },
      });

      // Send notifications for each quote
      for (const quote of simulation.quotes) {
        // Notify client (non-blocking)
        this.notificationsService.notifyQuoteSubmitted(
          simulation.user,
          quote.quoteNumber,
        ).catch(err => console.error('Failed to notify client:', err.message));
      }

      // Notify gestionnaires AND admins (non-blocking)
      this.prisma.user.findMany({
        where: { 
          role: { 
            in: ['ADMINISTRATEUR_ARS', 'GESTIONNAIRE_VALIDATION_ARS'] 
          } 
        },
      }).then(staffUsers => {
        if (simulation.quotes) {
          for (const quote of simulation.quotes) {
            this.notificationsService.notifyAdminNewQuote(
              staffUsers,
              `${simulation.user.firstName} ${simulation.user.lastName}`,
              quote.quoteNumber,
            ).catch(err => console.error('Failed to notify staff:', err.message));
          }
        }
      });

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@ars.com';
      for (const quote of simulation.quotes) {
        this.notificationsService.sendQuoteSubmitted(
          adminEmail,
          quote.quoteNumber,
          `${simulation.user.firstName} ${simulation.user.lastName}`,
        ).catch(err => console.error('Failed to send email:', err.message));
      }
    }

    await this.auditService.log(
      userId,
      'SIMULATION_SUBMITTED',
      'Simulation',
      id,
      { status: SimulationStatus.DRAFT },
      { status: SimulationStatus.SUBMITTED },
    );

    return updated;
  }

  async delete(id: string, userId: string) {
    const simulation = await this.findById(id);

    if (simulation.userId !== userId) {
      throw new ForbiddenException('You can only delete your own simulations');
    }

    if (simulation.quotes && simulation.quotes.length > 0) {
      throw new BadRequestException('Cannot delete simulation with generated quotes');
    }

    await this.prisma.simulation.delete({ where: { id } });

    await this.auditService.log(
      userId,
      'SIMULATION_DELETED',
      'Simulation',
      id,
      { status: simulation.status },
      null,
    );

    return { message: 'Simulation deleted successfully' };
  }
}
