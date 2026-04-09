import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FormulaEligibilityService } from '../formula-eligibility/formula-eligibility.service';
import { FormulaType, SimulationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SimulationsService {
  constructor(
    private prisma: PrismaService,
    private vehiclesService: VehiclesService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private formulaEligibilityService: FormulaEligibilityService,
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
    dcCapitals?: Record<string, number>;
    acCapitals?: Record<string, number>;
    fractionnement?: 'ANNUEL' | 'SEMESTRIEL';
    companyIds?: string[]; // Add companyIds to validate against
  }) {
    const vehicle = await this.vehiclesService.create(data.vehicle);
    const vehicleAge = this.vehiclesService.calculateVehicleAge(vehicle.firstCirculationDate);

    // Dynamic age validation using formula_eligibility_age_rules table
    if (data.companyIds && data.companyIds.length > 0) {
      await this.validateFormulaEligibility(data.companyIds, data.usageId, data.formulaType, vehicleAge);
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
        dcCapitals: data.dcCapitals ? data.dcCapitals : undefined,
        acCapitals: data.acCapitals ? data.acCapitals : undefined,
        fractionnement: data.fractionnement ?? 'ANNUEL', // Add fractionnement to database
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
      { formulaType: data.formulaType, usageId: data.usageId, fractionnement: data.fractionnement ?? 'ANNUEL' },
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
    dcCapitals?: Record<string, number>;
    acCapitals?: Record<string, number>;
    fractionnement?: 'ANNUEL' | 'SEMESTRIEL';
    companyIds?: string[]; // Add companyIds to validate against
  }) {
    const simulation = await this.findById(id);

    if (simulation.userId !== userId) {
      throw new ForbiddenException('You can only modify your own simulations');
    }

    if (simulation.status !== SimulationStatus.DRAFT) {
      throw new BadRequestException('Cannot modify submitted simulation');
    }

    // Dynamic age validation if formula or usage is being changed
    if ((data.formulaType || data.usageId) && simulation.vehicle) {
      const vehicleAge = this.vehiclesService.calculateVehicleAge(simulation.vehicle.firstCirculationDate);
      const formulaToCheck = data.formulaType || simulation.formulaType;
      const usageToCheck = data.usageId || simulation.usageId;
      
      if (data.companyIds && data.companyIds.length > 0) {
        await this.validateFormulaEligibility(data.companyIds, usageToCheck, formulaToCheck, vehicleAge);
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
    if (data.dcCapitals !== undefined) updateData.dcCapitals = data.dcCapitals ? data.dcCapitals : undefined;
    if (data.acCapitals !== undefined) updateData.acCapitals = data.acCapitals ? data.acCapitals : undefined;
    if (data.fractionnement !== undefined) updateData.fractionnement = data.fractionnement; // Add fractionnement to update

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
    // Age validation is now handled dynamically by the pricing engine using formula_eligibility_age_rules table

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

  /**
   * Validate formula eligibility against dynamic age rules for all selected companies
   * Throws BadRequestException if any company has a rule that blocks the formula
   */
  private async validateFormulaEligibility(
    companyIds: string[],
    usageId: string,
    formulaType: FormulaType,
    vehicleAge: number,
  ): Promise<void> {
    const errors: string[] = [];

    // Check eligibility for each company
    for (const companyId of companyIds) {
      const eligibility = await this.formulaEligibilityService.checkEligibility(
        companyId,
        usageId,
        formulaType,
        vehicleAge,
      );

      if (!eligibility.eligible) {
        // Get company name for better error message
        const company = await this.prisma.company.findUnique({
          where: { id: companyId },
          select: { name: true },
        });
        
        const companyName = company?.name || 'Compagnie sélectionnée';
        errors.push(`${companyName}: ${eligibility.reason}`);
      }
    }

    // If any company blocks the formula, throw error with all reasons
    if (errors.length > 0) {
      if (errors.length === 1) {
        throw new BadRequestException(errors[0]);
      } else {
        throw new BadRequestException(
          `La formule ${formulaType} n'est pas disponible pour ce véhicule :\n${errors.join('\n')}`,
        );
      }
    }
  }
}
