import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConventionStatus } from '@prisma/client';

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
        organization: { select: { id: true, name: true, code: true, isActive: true } },
        companies: {
          include: { company: { select: { id: true, name: true, code: true, isActive: true } } },
        },
        reductionRules: {
          where: { isActive: true },
          include: { company: { select: { id: true, name: true } } },
        },
        _count: {
          select: {
            companies: true,
            reductionRules: true,
            simulations: true,
            pricingRules: true,
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
        organization: true,
        companies: {
          include: { company: true },
        },
        reductionRules: {
          where: { isActive: true },
          include: { company: true },
        },
        pricingRules: {
          where: { isActive: true },
        },
      },
    });
    if (!convention) {
      throw new NotFoundException('Convention not found');
    }
    return convention;
  }

  async findByOrganization(organizationId: string) {
    return this.prisma.convention.findMany({
      where: { organizationId, isActive: true },
      include: {
        companies: {
          include: { company: true },
        },
        _count: { select: { reductionRules: true } },
      },
    });
  }

  async create(data: { 
    name: string; 
    organizationId: string;
    companyIds: string[];
    startDate?: string;
    endDate?: string;
    status?: ConventionStatus;
  }, userId?: string) {
    const organization = await this.prisma.clientOrganization.findUnique({
      where: { id: data.organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Validate all companies exist
    const companies = await this.prisma.company.findMany({
      where: { id: { in: data.companyIds } },
    });
    if (companies.length !== data.companyIds.length) {
      throw new BadRequestException('One or more companies not found');
    }

    const convention = await this.prisma.convention.create({
      data: {
        name: data.name,
        organizationId: data.organizationId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status || ConventionStatus.ACTIVE,
        companies: {
          create: data.companyIds.map(companyId => ({ companyId })),
        },
      },
      include: { organization: true, companies: { include: { company: true } } },
    });

    await this.auditService.log(
      userId,
      'CONVENTION_CREATED',
      'Convention',
      convention.id,
      null,
      { name: convention.name, organizationId: data.organizationId },
    );

    return convention;
  }

  async update(id: string, data: { 
    name?: string;
    companyIds?: string[];
    startDate?: string;
    endDate?: string;
    status?: ConventionStatus;
  }, userId?: string) {
    const existing = await this.findById(id);

    // Validate companies if provided
    if (data.companyIds) {
      const companies = await this.prisma.company.findMany({
        where: { id: { in: data.companyIds } },
      });
      if (companies.length !== data.companyIds.length) {
        throw new BadRequestException('One or more companies not found');
      }
    }

    const updated = await this.prisma.convention.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.status && { status: data.status }),
      },
      include: { organization: true, companies: { include: { company: true } } },
    });

    if (data.companyIds) {
      await this.prisma.conventionCompany.deleteMany({ where: { conventionId: id } });
      await this.prisma.conventionCompany.createMany({
        data: data.companyIds.map(companyId => ({ conventionId: id, companyId })),
      });
    }

    await this.auditService.log(
      userId,
      'CONVENTION_UPDATED',
      'Convention',
      id,
      { name: existing.name },
      { name: updated.name },
    );

    return this.findById(id);
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

  async findByUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            conventions: {
              where: { isActive: true },
              include: {
                companies: { include: { company: true } },
              },
            },
          },
        },
      },
    });
    return user?.organization?.conventions || [];
  }

  async validateUserConventionAccess(userId: string, conventionId: string, companyId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new NotFoundException('User has no organization');
    }

    const convention = await this.prisma.convention.findUnique({
      where: { id: conventionId },
      include: {
        companies: true,
      },
    });

    if (!convention) {
      throw new NotFoundException('Convention not found');
    }

    // Validate user's org matches convention's org
    if (convention.organizationId !== user.organizationId) {
      throw new ConflictException('User organization does not match convention organization');
    }

    // Validate selected company is in convention
    const companyInConvention = convention.companies.some(cc => cc.companyId === companyId);
    if (!companyInConvention) {
      throw new ConflictException('Selected company is not part of this convention');
    }

    return true;
  }
}
