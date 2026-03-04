import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FormulaType, UsageType, ReductionMetric } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ConventionReductionRulesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findByConvention(conventionId: string) {
    return this.prisma.conventionReductionRule.findMany({
      where: { conventionId, isActive: true },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
      },
      orderBy: [{ guarantee: { code: 'asc' } }, { priority: 'desc' }],
    });
  }

  async create(
    data: {
      conventionId: string;
      companyId?: string;
      guaranteeId: string;
      formulaType?: FormulaType;
      usageType?: UsageType;
      metric: ReductionMetric;
      minValue?: number;
      maxValue?: number;
      minInclusive?: boolean;
      maxInclusive?: boolean;
      discountPercent: number;
      priority?: number;
      validFrom?: Date;
      validTo?: Date;
    },
    userId: string,
  ) {
    // Validate convention exists
    const convention = await this.prisma.convention.findUnique({
      where: { id: data.conventionId },
    });
    if (!convention) {
      throw new NotFoundException('Convention not found');
    }

    // Validate company exists if specified
    if (data.companyId) {
      const company = await this.prisma.company.findUnique({ where: { id: data.companyId } });
      if (!company) {
        throw new NotFoundException('Company not found');
      }
    }

    // Validate guarantee exists
    const guarantee = await this.prisma.guarantee.findUnique({ where: { id: data.guaranteeId } });
    if (!guarantee) {
      throw new NotFoundException('Guarantee not found');
    }

    // Validate discountPercent is between 0 and 100
    if (data.discountPercent < 0 || data.discountPercent > 100) {
      throw new BadRequestException('Discount percent must be between 0 and 100');
    }

    const rule = await this.prisma.conventionReductionRule.create({
      data: {
        conventionId: data.conventionId,
        companyId: data.companyId,
        guaranteeId: data.guaranteeId,
        formulaType: data.formulaType,
        usageType: data.usageType,
        metric: data.metric,
        minValue: data.minValue ? new Decimal(data.minValue) : null,
        maxValue: data.maxValue ? new Decimal(data.maxValue) : null,
        minInclusive: data.minInclusive ?? true,
        maxInclusive: data.maxInclusive ?? false,
        discountPercent: new Decimal(data.discountPercent),
        priority: data.priority ?? 0,
        validFrom: data.validFrom || new Date(),
        validTo: data.validTo,
      },
      include: {
        convention: { select: { name: true } },
        company: { select: { name: true } },
        guarantee: { select: { code: true, nameFr: true } },
      },
    });

    await this.auditService.log(
      userId,
      'REDUCTION_RULE_CREATED',
      'ConventionReductionRule',
      rule.id,
      null,
      {
        conventionId: data.conventionId,
        guaranteeId: data.guaranteeId,
        discountPercent: data.discountPercent,
      },
    );

    return rule;
  }

  async update(
    id: string,
    data: {
      minValue?: number;
      maxValue?: number;
      minInclusive?: boolean;
      maxInclusive?: boolean;
      discountPercent?: number;
      priority?: number;
      validTo?: Date;
    },
    userId: string,
  ) {
    const existing = await this.prisma.conventionReductionRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Reduction rule not found');
    }

    const updated = await this.prisma.conventionReductionRule.update({
      where: { id },
      data: {
        ...(data.minValue !== undefined && { minValue: new Decimal(data.minValue) }),
        ...(data.maxValue !== undefined && { maxValue: new Decimal(data.maxValue) }),
        ...(data.minInclusive !== undefined && { minInclusive: data.minInclusive }),
        ...(data.maxInclusive !== undefined && { maxInclusive: data.maxInclusive }),
        ...(data.discountPercent !== undefined && { discountPercent: new Decimal(data.discountPercent) }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.validTo !== undefined && { validTo: data.validTo }),
      },
      include: {
        convention: { select: { name: true } },
        company: { select: { name: true } },
      },
    });

    await this.auditService.log(
      userId,
      'REDUCTION_RULE_UPDATED',
      'ConventionReductionRule',
      id,
      { discountPercent: existing.discountPercent },
      { discountPercent: updated.discountPercent },
    );

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const rule = await this.prisma.conventionReductionRule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Reduction rule not found');
    }

    const updated = await this.prisma.conventionReductionRule.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log(
      userId,
      'REDUCTION_RULE_DEACTIVATED',
      'ConventionReductionRule',
      id,
      { isActive: true },
      { isActive: false },
    );

    return updated;
  }

  async findMatchingRule(
    conventionId: string,
    companyId: string,
    guaranteeId: string,
    formulaType: FormulaType,
    usageType: UsageType,
    metricValue: Decimal,
    metric: ReductionMetric,
  ) {
    const rules = await this.prisma.conventionReductionRule.findMany({
      where: {
        conventionId,
        OR: [
          { companyId },
          { companyId: null }
        ],
        guaranteeId,
        isActive: true,
        validFrom: { lte: new Date() },
        metric,
        AND: [
          {
            OR: [
              { formulaType },
              { formulaType: null }
            ]
          },
          {
            OR: [
              { usageType },
              { usageType: null }
            ]
          },
          {
            OR: [
              { validTo: null },
              { validTo: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    for (const rule of rules) {
      const value = metricValue.toNumber();
      const min = rule.minValue?.toNumber();
      const max = rule.maxValue?.toNumber();

      const minCheck = min === null || min === undefined || 
        (rule.minInclusive ? value >= min : value > min);
      const maxCheck = max === null || max === undefined || 
        (rule.maxInclusive ? value <= max : value < max);

      if (minCheck && maxCheck) {
        return rule;
      }
    }

    return null;
  }
}
