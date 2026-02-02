import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FormulaType, UsageType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PricingRulesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(companyId?: string, guaranteeId?: string, bonusMalusClass?: string) {
    console.log('🔍 Filtering pricing rules:', { companyId, guaranteeId, bonusMalusClass });
    
    const where: any = {
      ...(companyId && { companyId }),
      ...(guaranteeId && { guaranteeId }),
      ...(bonusMalusClass && { bonusMalusClass: parseInt(bonusMalusClass) }),
      isActive: true,
    };
    
    console.log('📋 Where clause:', JSON.stringify(where, null, 2));
    
    const results = await this.prisma.pricingRule.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
        convention: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`✅ Found ${results.length} pricing rules`);
    return results;
  }

  async findById(id: string) {
    const rule = await this.prisma.pricingRule.findUnique({
      where: { id },
      include: {
        company: true,
        guarantee: true,
        convention: true,
      },
    });
    if (!rule) {
      throw new NotFoundException('Pricing rule not found');
    }
    return rule;
  }

  async create(
    data: {
      companyId: string;
      guaranteeId: string;
      conventionId?: string;
      formulaType?: FormulaType;
      minPower?: number;
      maxPower?: number;
      minAge?: number;
      maxAge?: number;
      baseRate?: number;
      fixedPremium?: number;
      multiplier?: number;
      reductionRate?: number;
      usageType?: UsageType;
      validFrom?: Date;
      validTo?: Date;
    },
    userId: string,
  ) {
    const rule = await this.prisma.pricingRule.create({
      data: {
        companyId: data.companyId,
        guaranteeId: data.guaranteeId,
        conventionId: data.conventionId,
        formulaType: data.formulaType,
        minPower: data.minPower,
        maxPower: data.maxPower,
        minAge: data.minAge,
        maxAge: data.maxAge,
        baseRate: data.baseRate ? new Decimal(data.baseRate) : null,
        fixedPremium: data.fixedPremium ? new Decimal(data.fixedPremium) : null,
        multiplier: data.multiplier ? new Decimal(data.multiplier) : null,
        reductionRate: data.reductionRate ? new Decimal(data.reductionRate) : null,
        usageType: data.usageType,
        validFrom: data.validFrom || new Date(),
        validTo: data.validTo,
      },
      include: {
        company: true,
        guarantee: true,
        convention: true,
      },
    });

    await this.auditService.log(
      userId,
      'PRICING_RULE_CREATED',
      'PricingRule',
      rule.id,
      null,
      { companyId: data.companyId, guaranteeId: data.guaranteeId },
    );

    return rule;
  }

  async update(
    id: string,
    data: {
      baseRate?: number;
      fixedPremium?: number;
      multiplier?: number;
      reductionRate?: number;
      validTo?: Date;
    },
    userId: string,
  ) {
    const existing = await this.findById(id);

    const updated = await this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...(data.baseRate !== undefined && { baseRate: new Decimal(data.baseRate) }),
        ...(data.fixedPremium !== undefined && { fixedPremium: new Decimal(data.fixedPremium) }),
        ...(data.multiplier !== undefined && { multiplier: new Decimal(data.multiplier) }),
        ...(data.reductionRate !== undefined && { reductionRate: new Decimal(data.reductionRate) }),
        ...(data.validTo !== undefined && { validTo: data.validTo }),
      },
      include: {
        company: true,
        guarantee: true,
        convention: true,
      },
    });

    await this.auditService.log(
      userId,
      'PRICING_RULE_UPDATED',
      'PricingRule',
      id,
      { baseRate: existing.baseRate, fixedPremium: existing.fixedPremium },
      { baseRate: updated.baseRate, fixedPremium: updated.fixedPremium },
    );

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const rule = await this.findById(id);

    const updated = await this.prisma.pricingRule.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log(
      userId,
      'PRICING_RULE_DEACTIVATED',
      'PricingRule',
      id,
      { isActive: true },
      { isActive: false },
    );

    return updated;
  }

  async updateReductionRate(id: string, reductionRate: number, userId: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.pricingRule.update({
      where: { id },
      data: { reductionRate: new Decimal(reductionRate) },
      include: {
        company: true,
        guarantee: true,
        convention: true,
      },
    });

    await this.auditService.log(
      userId,
      'PRICING_RULE_REDUCTION_UPDATED',
      'PricingRule',
      id,
      { reductionRate: existing.reductionRate },
      { reductionRate: updated.reductionRate },
    );

    return updated;
  }

  async getOptionalGuaranteesRules(companyId?: string) {
    const optionalGuarantees = ['VOL', 'INCENDIE', 'TOUS_RISQUES_0', 'DOMMAGES_COLLISIONS'];
    
    const guarantees = await this.prisma.guarantee.findMany({
      where: { code: { in: optionalGuarantees } },
    });

    const guaranteeIds = guarantees.map(g => g.id);

    return this.prisma.pricingRule.findMany({
      where: {
        guaranteeId: { in: guaranteeIds },
        ...(companyId && { companyId }),
        isActive: true,
      },
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
        convention: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
