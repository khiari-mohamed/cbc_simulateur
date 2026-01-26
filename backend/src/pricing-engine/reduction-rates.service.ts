import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Service to handle reduction rate logic
 * Ensures consistent application of reduction rates across all guarantees
 */
@Injectable()
export class ReductionRatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get reduction rate for a specific guarantee and convention
   * Reduction rates apply to: VOL, INCENDIE, TOUS_RISQUES_0, DOMMAGES_COLLISIONS
   */
  async getReductionRate(
    companyId: string,
    guaranteeCode: string,
    conventionId?: string,
  ): Promise<Decimal> {
    // Guarantees that DO NOT use reduction rates
    const noReductionGuarantees = [
      'RC',
      'CAS',
      'PERSONNES_TRANSPORTEES',
      'ASSISTANCE',
      'BG',
      'INCENDIE_EMEUTES',
      'CATASTROPHES_NATURELLES',
      'DOMMAGES_EMEUTES',
      'DEFENSE_RECOURS',
    ];

    // If guarantee doesn't use reduction rates, return 1 (no reduction)
    if (noReductionGuarantees.includes(guaranteeCode)) {
      return new Decimal(1);
    }

    // Find the pricing rule with reduction rate
    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        company: { id: companyId },
        guarantee: { code: guaranteeCode },
        isActive: true,
        ...(conventionId && { conventionId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return reduction rate if exists, otherwise 1 (100% = no reduction)
    if (rule && rule.reductionRate) {
      return new Decimal(rule.reductionRate);
    }

    return new Decimal(1);
  }

  /**
   * Apply reduction rate to a premium
   */
  applyReductionRate(premium: Decimal, reductionRate: Decimal): Decimal {
    if (!reductionRate || reductionRate.eq(0)) {
      return premium;
    }
    return premium.mul(reductionRate);
  }

  /**
   * Get all reduction rates for a company (for admin display)
   */
  async getCompanyReductionRates(companyId: string) {
    const reducibleGuarantees = ['VOL', 'INCENDIE', 'TOUS_RISQUES_ZERO', 'DOMMAGES_COLLISIONS'];

    const rates = await Promise.all(
      reducibleGuarantees.map(async (code) => ({
        guaranteeCode: code,
        rate: await this.getReductionRate(companyId, code),
      })),
    );

    return rates;
  }

  /**
   * Update reduction rate for a guarantee
   */
  async updateReductionRate(
    companyId: string,
    guaranteeCode: string,
    rate: number,
    conventionId?: string,
  ) {
    const guarantee = await this.prisma.guarantee.findUnique({
      where: { code: guaranteeCode },
    });

    if (!guarantee) {
      throw new Error(`Guarantee not found: ${guaranteeCode}`);
    }

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        companyId,
        guaranteeId: guarantee.id,
        ...(conventionId && { conventionId }),
      },
    });

    if (!rule) {
      // Create new rule with reduction rate
      return this.prisma.pricingRule.create({
        data: {
          companyId,
          guaranteeId: guarantee.id,
          reductionRate: new Decimal(rate),
          isActive: true,
          ...(conventionId && { conventionId }),
        },
      });
    }

    // Update existing rule
    return this.prisma.pricingRule.update({
      where: { id: rule.id },
      data: { reductionRate: new Decimal(rate) },
    });
  }
}
