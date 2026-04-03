import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { FormulaType, ReductionMetric } from '@prisma/client';

@Injectable()
export class ReductionRatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get reduction rate using ConventionReductionRule with paliers
   * Returns discount percent (35 means 35% discount, apply as: prime * (1 - 35/100))
   * @param systemRole - The system role of the guarantee (e.g., 'MANDATORY_VOL', 'MANDATORY_INCENDIE')
   */
  async getReductionPercent(
    companyId: string,
    systemRole: string,
    conventionId: string | undefined,
    metricValue: Decimal,
    metric: ReductionMetric,
    formulaType?: FormulaType,
    usageId?: string,
  ): Promise<number> {
    if (!conventionId) return 0; // No convention = no reduction

    // Look up guarantee by systemRole, not by code
    const guarantee = await this.prisma.guarantee.findFirst({ 
      where: { systemRole: systemRole as any, isActive: true } 
    });
    if (!guarantee) return 0;

    // Find matching rules ordered by priority desc, then created desc
    const rules = await this.prisma.conventionReductionRule.findMany({
      where: {
        conventionId,
        OR: [
          { companyId },
          { companyId: null }
        ],
        guaranteeId: guarantee.id,
        metric,
        isActive: true,
        validFrom: { lte: new Date() },
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
              { validTo: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    // Find first matching rule by range
    for (const rule of rules) {
      const value = metricValue.toNumber();
      const min = rule.minValue?.toNumber();
      const max = rule.maxValue?.toNumber();

      const minCheck = min === null || min === undefined || 
        (rule.minInclusive ? value >= min : value > min);
      const maxCheck = max === null || max === undefined || 
        (rule.maxInclusive ? value <= max : value < max);

      if (minCheck && maxCheck) {
        return rule.discountPercent.toNumber();
      }
    }

    return 0; // No matching rule
  }

  /**
   * Apply discount percent to premium
   * discountPercent: 35 means 35% discount
   * Formula: prime * (1 - discountPercent / 100)
   */
  applyDiscount(premium: Decimal, discountPercent: number): Decimal {
    if (discountPercent <= 0) return premium;
    const multiplier = new Decimal(1).sub(new Decimal(discountPercent).div(100));
    return premium.mul(multiplier);
  }
}