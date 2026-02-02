import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ConventionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.convention.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        company: { select: { id: true, name: true, code: true, isActive: true } },
        guarantees: {
          include: { guarantee: true },
        },
        _count: {
          select: {
            users: true,
            simulations: true,
            pricingRules: true,
            guarantees: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.findById(id);
  }

  async findById(id: string) {
    const convention = await this.prisma.convention.findUnique({
      where: { id },
      include: {
        company: true,
        users: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, role: true },
            },
          },
        },
        guarantees: {
          include: { guarantee: true },
        },
        pricingRules: {
          where: { isActive: true },
          include: { guarantee: true },
        },
      },
    });
    if (!convention) {
      throw new NotFoundException('Convention not found');
    }
    return convention;
  }

  async findByCompany(companyId: string) {
    return this.prisma.convention.findMany({
      where: { companyId, isActive: true },
      include: {
        _count: { select: { users: true } },
      },
    });
  }

  async create(data: { 
    name: string; 
    companyId: string;
    reductionTousRisques?: number;
    reductionDommagesCollision?: number;
    reductionVol?: number;
    reductionIncendie?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }, userId?: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const convention = await this.prisma.convention.create({
      data: {
        name: data.name,
        companyId: data.companyId,
        reductionTousRisques: data.reductionTousRisques,
        reductionDommagesCollision: data.reductionDommagesCollision,
        reductionVol: data.reductionVol,
        reductionIncendie: data.reductionIncendie,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status || 'ACTIVE',
      },
      include: { company: true },
    });

    await this.auditService.log(
      userId,
      'CONVENTION_CREATED',
      'Convention',
      convention.id,
      null,
      { name: convention.name, companyId: data.companyId },
    );

    return convention;
  }

  async update(id: string, data: { 
    name?: string;
    reductionTousRisques?: number;
    reductionDommagesCollision?: number;
    reductionVol?: number;
    reductionIncendie?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }, userId?: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.convention.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.reductionTousRisques !== undefined && { reductionTousRisques: data.reductionTousRisques }),
        ...(data.reductionDommagesCollision !== undefined && { reductionDommagesCollision: data.reductionDommagesCollision }),
        ...(data.reductionVol !== undefined && { reductionVol: data.reductionVol }),
        ...(data.reductionIncendie !== undefined && { reductionIncendie: data.reductionIncendie }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.status && { status: data.status }),
      },
      include: { company: true },
    });

    await this.auditService.log(
      userId,
      'CONVENTION_UPDATED',
      'Convention',
      id,
      { name: existing.name },
      { name: updated.name },
    );

    return updated;
  }

  async remove(id: string) {
    return this.deactivate(id, 'system');
  }

  async deactivate(id: string, userId: string) {
    const convention = await this.findById(id);

    const updated = await this.prisma.convention.update({
      where: { id },
      data: { isActive: false },
    });

    // Only log if userId is a valid UUID
    if (userId && userId !== 'system') {
      await this.auditService.log(
        userId,
        'CONVENTION_DEACTIVATED',
        'Convention',
        id,
        { isActive: true },
        { isActive: false },
      );
    }

    return updated;
  }

  async assignUser(userId: string, conventionId: string, adminId?: string) {
    return this.assignToUser(userId, conventionId, adminId || 'system');
  }

  async assignToUser(userId: string, conventionId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const convention = await this.prisma.convention.findUnique({ where: { id: conventionId } });
    if (!convention) {
      throw new NotFoundException('Convention not found');
    }

    const existing = await this.prisma.userConvention.findUnique({
      where: {
        userId_conventionId: { userId, conventionId },
      },
    });

    if (existing) {
      throw new ConflictException('User already assigned to this convention');
    }

    // Check for active conventions with same company
    const userConventions = await this.prisma.userConvention.findMany({
      where: { userId },
      include: { convention: true },
    });

    const hasActiveConventionForCompany = userConventions.some(
      uc => uc.convention?.isActive && uc.convention?.companyId === convention.companyId
    );

    if (hasActiveConventionForCompany) {
      throw new ConflictException(
        'User already has an active convention for this company. Deactivate the existing convention first to avoid pricing ambiguity.'
      );
    }

    const assignment = await this.prisma.userConvention.create({
      data: { userId, conventionId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        convention: { select: { name: true } },
      },
    });

    // Only log if adminId is a valid UUID
    if (adminId && adminId !== 'system') {
      await this.auditService.log(
        adminId,
        'CONVENTION_ASSIGNED',
        'UserConvention',
        `${userId}-${conventionId}`,
        null,
        { userId, conventionId },
      );
    }

    return assignment;
  }

  async unassignUser(userId: string, conventionId: string, adminId?: string) {
    return this.removeFromUser(userId, conventionId, adminId || 'system');
  }

  async removeFromUser(userId: string, conventionId: string, adminId: string) {
    const existing = await this.prisma.userConvention.findUnique({
      where: {
        userId_conventionId: { userId, conventionId },
      },
    });

    if (!existing) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.userConvention.delete({
      where: {
        userId_conventionId: { userId, conventionId },
      },
    });

    // Only log if adminId is a valid UUID
    if (adminId && adminId !== 'system') {
      await this.auditService.log(
        adminId,
        'CONVENTION_REMOVED',
        'UserConvention',
        `${userId}-${conventionId}`,
        { userId, conventionId },
        null,
      );
    }

    return { message: 'Convention removed from user' };
  }

  async getUsers(conventionId: string) {
    return this.getUsersByConvention(conventionId);
  }

  async getUsersByConvention(conventionId: string) {
    return this.prisma.userConvention.findMany({
      where: { conventionId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
        },
      },
    });
  }

  async findByUser(userId: string) {
    const userConventions = await this.prisma.userConvention.findMany({
      where: { userId },
      include: {
        convention: {
          include: {
            company: true,
          },
        },
      },
    });
    return userConventions.map(uc => uc.convention);
  }

  async assignGuarantees(conventionId: string, guaranteeIds: string[], adminId: string) {
    await this.findById(conventionId);

    await this.prisma.conventionGuarantee.deleteMany({
      where: { conventionId },
    });

    if (guaranteeIds.length > 0) {
      await this.prisma.conventionGuarantee.createMany({
        data: guaranteeIds.map(guaranteeId => ({
          conventionId,
          guaranteeId,
        })),
      });
    }

    if (adminId && adminId !== 'system') {
      await this.auditService.log(
        adminId,
        'GUARANTEES_ASSIGNED_TO_CONVENTION',
        'Convention',
        conventionId,
        null,
        { guaranteeIds },
      );
    }

    return this.findById(conventionId);
  }
}
