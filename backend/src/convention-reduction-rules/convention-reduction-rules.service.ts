import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FormulaType, ReductionMetric, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

interface CreateReductionRuleDto {
  conventionId: string;
  companyId?: string | null;
  guaranteeId: string;
  formulaType?: FormulaType | null;
  usageId?: string | null;
  metric: ReductionMetric;
  minValue?: number | null;
  maxValue?: number | null;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  discountPercent: number;
  priority?: number;
  validFrom?: Date;
  validTo?: Date | null;
}

interface UpdateReductionRuleDto {
  companyId?: string | null;
  guaranteeId?: string;
  formulaType?: FormulaType | null;
  usageId?: string | null;
  metric?: ReductionMetric;
  minValue?: number | null;
  maxValue?: number | null;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  discountPercent?: number;
  priority?: number;
  validTo?: Date | null;
}

@Injectable()
export class ConventionReductionRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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

  async create(data: CreateReductionRuleDto, userId: string) {
    // Validate discountPercent is between 0 and 100
    if (data.discountPercent < 0 || data.discountPercent > 100) {
      throw new BadRequestException('Discount percent must be between 0 and 100');
    }

    // Validate min/max values
    if (data.minValue != null && data.maxValue != null && data.minValue >= data.maxValue) {
      throw new BadRequestException('La valeur minimale doit être inférieure à la valeur maximale');
    }

    // Validate metric/guarantee combination
    const guarantee = await this.prisma.guarantee.findUnique({ where: { id: data.guaranteeId } });
    if (!guarantee) {
      throw new NotFoundException('Guarantee not found');
    }

    if (data.metric === 'DC_CAPITAL' && !['DOMMAGES_COLLISIONS', 'BG'].includes(guarantee.code)) {
      throw new BadRequestException('DC_CAPITAL metric is only valid for Dommages Collision (DC) and Bris de Glaces (BG) guarantees');
    }

    // Build Prisma create object - omit undefined fields
    const createData: Prisma.ConventionReductionRuleUncheckedCreateInput = {
      conventionId: data.conventionId,
      guaranteeId: data.guaranteeId,
      metric: data.metric,
      discountPercent: new Decimal(data.discountPercent),
      minInclusive: data.minInclusive ?? true,
      maxInclusive: data.maxInclusive ?? false,
      validFrom: data.validFrom || new Date(),
      priority: data.priority ?? 0,
    };

    // Handle optional nullable fields
    if (data.companyId !== undefined) {
      createData.companyId = data.companyId;
    }
    if (data.formulaType !== undefined) {
      createData.formulaType = data.formulaType;
    }
    if (data.usageId !== undefined) {
      createData.usageId = data.usageId;
    }
    if (data.validTo !== undefined) {
      createData.validTo = data.validTo;
    }

    // Handle Decimal fields (preserve 0)
    if (data.minValue !== undefined) {
      createData.minValue = data.minValue !== null ? new Decimal(data.minValue) : null;
    }
    if (data.maxValue !== undefined) {
      createData.maxValue = data.maxValue !== null ? new Decimal(data.maxValue) : null;
    }

    try {
      const rule = await this.prisma.conventionReductionRule.create({
        data: createData,
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
          minValue: data.minValue,
          maxValue: data.maxValue,
        },
      );

      return rule;
    } catch (error: unknown) {
      // Handle foreign key constraint violations with specific error messages
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint failed - determine which relation
          const meta = error.meta as { field_name?: string };
          const field = meta?.field_name;
          
          if (field?.includes('conventionId')) {
            throw new NotFoundException('Convention not found');
          }
          if (field?.includes('companyId')) {
            throw new NotFoundException('Company not found');
          }
          if (field?.includes('guaranteeId')) {
            throw new NotFoundException('Guarantee not found');
          }
          if (field?.includes('usageId')) {
            throw new NotFoundException('Usage not found');
          }
          
          // Generic fallback
          throw new NotFoundException('Related entity not found');
        }
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateReductionRuleDto, userId: string) {
    const existing = await this.prisma.conventionReductionRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Reduction rule not found');
    }

    // Validate discountPercent if specified
    if (data.discountPercent !== undefined && (data.discountPercent < 0 || data.discountPercent > 100)) {
      throw new BadRequestException('Discount percent must be between 0 and 100');
    }

    // Validate min/max values (consider existing values if not provided)
    const minVal = data.minValue !== undefined ? data.minValue : existing.minValue?.toNumber();
    const maxVal = data.maxValue !== undefined ? data.maxValue : existing.maxValue?.toNumber();

    if (minVal != null && maxVal != null && minVal >= maxVal) {
      throw new BadRequestException('La valeur minimale doit être inférieure à la valeur maximale');
    }

    // Build update object with proper types - omit undefined fields
    const updateData: Prisma.ConventionReductionRuleUncheckedUpdateInput = {};

    if (data.companyId !== undefined) {
      updateData.companyId = data.companyId;
    }
    if (data.guaranteeId !== undefined) {
      updateData.guaranteeId = data.guaranteeId;
    }
    if (data.formulaType !== undefined) {
      updateData.formulaType = data.formulaType;
    }
    if (data.usageId !== undefined) {
      updateData.usageId = data.usageId;
    }
    if (data.metric !== undefined) {
      updateData.metric = data.metric;
    }
    if (data.minInclusive !== undefined) {
      updateData.minInclusive = data.minInclusive;
    }
    if (data.maxInclusive !== undefined) {
      updateData.maxInclusive = data.maxInclusive;
    }
    if (data.discountPercent !== undefined) {
      updateData.discountPercent = new Decimal(data.discountPercent);
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    if (data.validTo !== undefined) {
      updateData.validTo = data.validTo;
    }

    // Handle Decimal fields (preserve 0)
    if (data.minValue !== undefined) {
      updateData.minValue = data.minValue !== null ? new Decimal(data.minValue) : null;
    }
    if (data.maxValue !== undefined) {
      updateData.maxValue = data.maxValue !== null ? new Decimal(data.maxValue) : null;
    }

    try {
      const updated = await this.prisma.conventionReductionRule.update({
        where: { id },
        data: updateData,
        include: {
          convention: { select: { name: true } },
          company: { select: { name: true } },
          guarantee: { select: { code: true, nameFr: true } },
        },
      });

      // Log ALL changes, not just discountPercent
      const changes: Record<string, any> = {};
      if (data.discountPercent !== undefined) {
        changes.discountPercent = { old: existing.discountPercent.toString(), new: updated.discountPercent.toString() };
      }
      if (data.minValue !== undefined) {
        changes.minValue = { old: existing.minValue?.toString(), new: updated.minValue?.toString() };
      }
      if (data.maxValue !== undefined) {
        changes.maxValue = { old: existing.maxValue?.toString(), new: updated.maxValue?.toString() };
      }
      if (data.priority !== undefined) {
        changes.priority = { old: existing.priority, new: updated.priority };
      }

      await this.auditService.log(
        userId,
        'REDUCTION_RULE_UPDATED',
        'ConventionReductionRule',
        id,
        existing,
        changes,
      );

      return updated;
    } catch (error: unknown) {
      // Handle foreign key constraint violations with specific error messages
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          const meta = error.meta as { field_name?: string };
          const field = meta?.field_name;
          
          if (field?.includes('companyId')) {
            throw new NotFoundException('Company not found');
          }
          if (field?.includes('guaranteeId')) {
            throw new NotFoundException('Guarantee not found');
          }
          if (field?.includes('usageId')) {
            throw new NotFoundException('Usage not found');
          }
          
          throw new NotFoundException('Related entity not found');
        }
      }
      throw error;
    }
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
    usageId: string,
    metricValue: Decimal,
    metric: ReductionMetric,
  ) {
    const now = new Date();

    const rules = await this.prisma.conventionReductionRule.findMany({
      where: {
        conventionId,
        OR: [
          { companyId },
          { companyId: null }
        ],
        guaranteeId,
        isActive: true,
        validFrom: { lte: now },
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
              { usageId },
              { usageId: null }
            ]
          },
          {
            OR: [
              { validTo: null },
              { validTo: { gte: now } }
            ]
          }
        ]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    // Using .toNumber() is safe for discount percentages (0-100 range)
    const value = metricValue.toNumber();

    for (const rule of rules) {
      const min = rule.minValue?.toNumber();
      const max = rule.maxValue?.toNumber();

      const minCheck = min == null || (rule.minInclusive ? value >= min : value > min);
      const maxCheck = max == null || (rule.maxInclusive ? value <= max : value < max);

      if (minCheck && maxCheck) {
        return rule;
      }
    }

    return null;
  }
}
