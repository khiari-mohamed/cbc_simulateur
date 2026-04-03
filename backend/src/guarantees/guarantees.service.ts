import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GuaranteesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.guarantee.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: {
            pricingRules: true,
            simulationGuarantees: true,
            quoteItems: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findById(id: string) {
    const guarantee = await this.prisma.guarantee.findUnique({
      where: { id },
      include: {
        pricingRules: {
          where: { isActive: true },
          include: { company: true, convention: true },
        },
      },
    });
    if (!guarantee) {
      throw new NotFoundException('Guarantee not found');
    }
    return guarantee;
  }

  async findByCode(code: string) {
    return this.prisma.guarantee.findUnique({
      where: { code },
    });
  }

  async create(data: {
    code: string;
    nameFr: string;
    nameAr?: string;
    nameEn?: string;
    isOptional: boolean;
    systemRole?: string;
  }, userId: string) {
    const existing = await this.prisma.guarantee.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException('Guarantee code already exists');
    }

    const guarantee = await this.prisma.guarantee.create({ 
      data: {
        code: data.code,
        nameFr: data.nameFr,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        isOptional: data.isOptional,
        systemRole: data.systemRole as any,
      }
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_CREATED',
      'Guarantee',
      guarantee.id,
      null,
      { code: guarantee.code, nameFr: guarantee.nameFr },
    );

    return guarantee;
  }

  async update(id: string, data: {
    nameFr?: string;
    nameAr?: string;
    nameEn?: string;
    isOptional?: boolean;
    systemRole?: string;
  }, userId: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.guarantee.update({
      where: { id },
      data: {
        ...(data.nameFr !== undefined && { nameFr: data.nameFr }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.isOptional !== undefined && { isOptional: data.isOptional }),
        ...(data.systemRole !== undefined && { systemRole: data.systemRole as any }),
      },
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_UPDATED',
      'Guarantee',
      id,
      { nameFr: existing.nameFr, isOptional: existing.isOptional, systemRole: existing.systemRole },
      { nameFr: updated.nameFr, isOptional: updated.isOptional, systemRole: updated.systemRole },
    );

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const guarantee = await this.findById(id);

    const updated = await this.prisma.guarantee.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_DEACTIVATED',
      'Guarantee',
      id,
      { isActive: true },
      { isActive: false },
    );

    return updated;
  }

  async reactivate(id: string, userId: string) {
    const guarantee = await this.prisma.guarantee.findUnique({ where: { id } });
    if (!guarantee) {
      throw new NotFoundException('Guarantee not found');
    }

    const updated = await this.prisma.guarantee.update({
      where: { id },
      data: { isActive: true },
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_REACTIVATED',
      'Guarantee',
      id,
      { isActive: false },
      { isActive: true },
    );

    return updated;
  }

  async delete(id: string, userId: string) {
    const guarantee = await this.findById(id);

    // Check if guarantee is used in any relations
    const usageCount = await this.prisma.guarantee.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pricingRules: true,
            simulationGuarantees: true,
            quoteItems: true,
            conventionReductionRules: true,
            parentBundlings: true,
            includedInBundlings: true,
            availabilityConfigs: true,
          },
        },
      },
    });

    const totalUsage = usageCount?._count ? 
      Object.values(usageCount._count).reduce((sum, count) => sum + count, 0) : 0;

    if (totalUsage > 0) {
      throw new ConflictException(
        `Cannot delete guarantee. It is used in ${totalUsage} relation(s). Please deactivate it instead.`
      );
    }

    await this.prisma.guarantee.delete({
      where: { id },
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_DELETED',
      'Guarantee',
      id,
      { code: guarantee.code, nameFr: guarantee.nameFr },
      null,
    );

    return { message: 'Guarantee deleted permanently' };
  }

  async getRequiredGuarantees() {
    return this.prisma.guarantee.findMany({
      where: {
        isActive: true,
        isOptional: false,
      },
    });
  }

  async getOptionalGuarantees() {
    return this.prisma.guarantee.findMany({
      where: {
        isActive: true,
        isOptional: true,
      },
    });
  }

  async findByConvention(conventionId: string, includeInactive = false) {
    // Since conventions are now organization-level, return all guarantees
    // Convention-specific guarantee filtering should be done at the reduction rule level
    return this.findAll(includeInactive);
  }
}
