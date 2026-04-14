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
    if (!conventionId) {
      console.log(`[ReductionRates] No conventionId provided for ${systemRole} - skipping reduction`);
      return 0;
    }

    // Look up guarantee by systemRole, not by code
    const guarantee = await this.prisma.guarantee.findFirst({ 
      where: { systemRole: systemRole as any, isActive: true } 
    });
    if (!guarantee) {
      console.log(`[ReductionRates] No guarantee found for systemRole: ${systemRole}`);
      return 0;
    }

    console.log(`[ReductionRates] Searching reduction for:`, {
      conventionId,
      companyId,
      guaranteeCode: guarantee.code,
      metric,
      metricValue: metricValue.toNumber(),
      formulaType,
      usageId
    });

    // Find matching rules ordered by priority desc, then created desc
    // CRITICAL FIX: The query was too restrictive - it required EXACT match on formulaType and usageId
    // But rules with NULL formulaType/usageId should match ANY formula/usage
    const rules = await this.prisma.conventionReductionRule.findMany({
      where: {
        conventionId,
        guaranteeId: guarantee.id,
        metric,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validTo: null },
          { validTo: { gte: new Date() } }
        ],
        // Company filter: match specific company OR null (applies to all)
        AND: [
          {
            OR: [
              { companyId },
              { companyId: null }
            ]
          },
          // Formula filter: match specific formula OR null (applies to all)
          {
            OR: [
              { formulaType },
              { formulaType: null }
            ]
          },
          // Usage filter: match specific usage OR null (applies to all)
          {
            OR: [
              { usageId },
              { usageId: null }
            ]
          }
        ]
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    console.log(`[ReductionRates] Found ${rules.length} potential rules`);

    // 🔧 CRITICAL FIX: Sort rules by specificity to prefer specific rules over generic catch-all rules
    // Specificity priority:
    // 1. Specific company (companyId matches) > Generic company (companyId = null)
    // 2. Specific formula (formulaType matches) > Generic formula (formulaType = null)
    // 3. Specific usage (usageId matches) > Generic usage (usageId = null)
    // 4. Specific range (min/max defined) > Catch-all range (min/max = null)
    // 5. Higher priority > Lower priority
    // 6. Newer (createdAt) > Older
    const sortedRules = rules.sort((a, b) => {
      // 1. Prefer specific company over generic (null)
      const aCompanySpecific = a.companyId === companyId ? 1 : 0;
      const bCompanySpecific = b.companyId === companyId ? 1 : 0;
      if (aCompanySpecific !== bCompanySpecific) return bCompanySpecific - aCompanySpecific;

      // 2. Prefer specific formula over generic (null)
      const aFormulaSpecific = a.formulaType === formulaType ? 1 : 0;
      const bFormulaSpecific = b.formulaType === formulaType ? 1 : 0;
      if (aFormulaSpecific !== bFormulaSpecific) return bFormulaSpecific - aFormulaSpecific;

      // 3. Prefer specific usage over generic (null)
      const aUsageSpecific = a.usageId === usageId ? 1 : 0;
      const bUsageSpecific = b.usageId === usageId ? 1 : 0;
      if (aUsageSpecific !== bUsageSpecific) return bUsageSpecific - aUsageSpecific;

      // 4. Prefer specific range over catch-all (null-null)
      const aHasRange = (a.minValue !== null && a.minValue !== undefined) || (a.maxValue !== null && a.maxValue !== undefined) ? 1 : 0;
      const bHasRange = (b.minValue !== null && b.minValue !== undefined) || (b.maxValue !== null && b.maxValue !== undefined) ? 1 : 0;
      if (aHasRange !== bHasRange) return bHasRange - aHasRange;

      // 5. Prefer higher priority
      if (a.priority !== b.priority) return b.priority - a.priority;

      // 6. Prefer newer (createdAt desc)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    console.log(`[ReductionRates] Rules sorted by specificity:`);
    sortedRules.forEach((rule, index) => {
      console.log(`  ${index + 1}. Company: ${rule.companyId ? 'SPECIFIC' : 'ALL'}, Formula: ${rule.formulaType || 'ALL'}, Range: ${rule.minValue || 'null'}-${rule.maxValue || 'null'}, Discount: ${rule.discountPercent}%`);
    });

    // Find first matching rule by range
    for (const rule of sortedRules) {
      const value = metricValue.toNumber();
      const min = rule.minValue?.toNumber();
      const max = rule.maxValue?.toNumber();

      const minCheck = min === null || min === undefined || 
        (rule.minInclusive ? value >= min : value > min);
      const maxCheck = max === null || max === undefined || 
        (rule.maxInclusive ? value <= max : value < max);

      if (minCheck && maxCheck) {
        const discountPercent = rule.discountPercent.toNumber();
        console.log(`[ReductionRates] ✅ Applying ${discountPercent}% reduction for ${guarantee.code} (Company: ${rule.companyId ? 'SPECIFIC' : 'ALL'}, Range: ${min || 'null'}-${max || 'null'})`);
        return discountPercent;
      }
    }

    console.log(`[ReductionRates] ❌ No matching rule found for ${guarantee.code}`);
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