import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FormulaType, ReferenceValue } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PricingRulesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(companyId?: string, guaranteeId?: string, bonusMalusClass?: string, usageId?: string) {
    console.log('🔍 Filtering pricing rules:', { companyId, guaranteeId, bonusMalusClass, usageId });

    const where: any = {
      ...(companyId && { companyId }),
      ...(guaranteeId && { guaranteeId }),
      ...(bonusMalusClass !== undefined && { bonusMalusClass: Number(bonusMalusClass) }),
      ...(usageId && { usageId }),
      isActive: true,
    };

    console.log('📋 Where clause:', JSON.stringify(where, null, 2));

    const results = await this.prisma.pricingRule.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, code: true } },
        guarantee: { select: { id: true, code: true, nameFr: true } },
        convention: { select: { id: true, name: true } },
        usage: { select: { id: true, code: true, nameFr: true, isActive: true } },
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
        usage: true,
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
      ratePercentage?: number;
      franchiseRate?: number;
      minCapital?: number;
      maxCapital?: number;
      minMarketValue?: number;
      maxMarketValue?: number;
      usageId?: string;
      referenceValue?: ReferenceValue;
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
        baseRate: data.baseRate !== undefined ? new Decimal(data.baseRate) : null,
        fixedPremium: data.fixedPremium !== undefined ? new Decimal(data.fixedPremium) : null,
        multiplier: data.multiplier !== undefined ? new Decimal(data.multiplier) : null,
        reductionRate: data.reductionRate !== undefined ? new Decimal(data.reductionRate) : null,
        ratePercentage: data.ratePercentage !== undefined ? new Decimal(data.ratePercentage) : null,
        franchiseRate: data.franchiseRate,
        minCapital: data.minCapital !== undefined ? new Decimal(data.minCapital) : null,
        maxCapital: data.maxCapital !== undefined ? new Decimal(data.maxCapital) : null,
        minMarketValue: data.minMarketValue !== undefined ? new Decimal(data.minMarketValue) : null,
        maxMarketValue: data.maxMarketValue !== undefined ? new Decimal(data.maxMarketValue) : null,
        usageId: data.usageId,
        referenceValue: data.referenceValue,
        validFrom: data.validFrom || new Date(),
        validTo: data.validTo,
      },
      include: {
        company: true,
        guarantee: true,
        convention: true,
        usage: true,
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
      ratePercentage?: number;
      baseRate?: number;
      fixedPremium?: number;
      multiplier?: number;
      reductionRate?: number;
      minCapital?: number;
      maxCapital?: number;
      minMarketValue?: number;
      maxMarketValue?: number;
      franchiseRate?: number;
      usageId?: string;
      referenceValue?: ReferenceValue;
      validTo?: Date;
    },
    userId: string,
  ) {
    const existing = await this.findById(id);

    const updated = await this.prisma.pricingRule.update({
      where: { id },
      data: {
        ...(data.ratePercentage !== undefined && { ratePercentage: new Decimal(data.ratePercentage) }),
        ...(data.baseRate !== undefined && { baseRate: new Decimal(data.baseRate) }),
        ...(data.fixedPremium !== undefined && { fixedPremium: new Decimal(data.fixedPremium) }),
        ...(data.multiplier !== undefined && { multiplier: new Decimal(data.multiplier) }),
        ...(data.reductionRate !== undefined && { reductionRate: new Decimal(data.reductionRate) }),
        ...(data.minCapital !== undefined && { minCapital: new Decimal(data.minCapital) }),
        ...(data.maxCapital !== undefined && { maxCapital: new Decimal(data.maxCapital) }),
        ...(data.minMarketValue !== undefined && { minMarketValue: new Decimal(data.minMarketValue) }),
        ...(data.maxMarketValue !== undefined && { maxMarketValue: new Decimal(data.maxMarketValue) }),
        ...(data.franchiseRate !== undefined && { franchiseRate: data.franchiseRate }),
        ...(data.usageId !== undefined && { usageId: data.usageId }),
        ...(data.referenceValue !== undefined && { referenceValue: data.referenceValue }),
        ...(data.validTo !== undefined && { validTo: data.validTo }),
      },
      include: {
        company: true,
        guarantee: true,
        convention: true,
        usage: true,
      },
    });

    await this.auditService.log(
      userId,
      'PRICING_RULE_UPDATED',
      'PricingRule',
      id,
      { ratePercentage: existing.ratePercentage, baseRate: existing.baseRate, fixedPremium: existing.fixedPremium, minCapital: existing.minCapital, usageId: existing.usageId, referenceValue: existing.referenceValue },
      { ratePercentage: updated.ratePercentage, baseRate: updated.baseRate, fixedPremium: updated.fixedPremium, minCapital: updated.minCapital, usageId: updated.usageId, referenceValue: updated.referenceValue },
    );

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const rule = await this.findById(id);

    const updated = await this.prisma.pricingRule.update({
      where: { id },
      data: { isActive: false },
      include: {
        company: true,
        guarantee: true,
        convention: true,
        usage: true,
      },
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
        usage: true,
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
    // Dynamically fetch all optional guarantees instead of hardcoding
    const guarantees = await this.prisma.guarantee.findMany({
      where: { isOptional: true },
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
        usage: { select: { id: true, code: true, nameFr: true } },
      },
      orderBy: [
        { company: { name: 'asc' } },
        { guarantee: { nameFr: 'asc' } },
        { usage: { nameFr: 'asc' } },
      ],
    });
  }

  async bulkCopy(ruleIds: string[], targetCompanyIds: string[], userId: string) {
    const rules = await this.prisma.pricingRule.findMany({
      where: { id: { in: ruleIds }, isActive: true },
    });

    const createdRules = [];
    for (const rule of rules) {
      for (const targetCompanyId of targetCompanyIds) {
        const newRule = await this.prisma.pricingRule.create({
          data: {
            companyId: targetCompanyId,
            guaranteeId: rule.guaranteeId,
            conventionId: rule.conventionId,
            formulaType: rule.formulaType,
            minPower: rule.minPower,
            maxPower: rule.maxPower,
            minAge: rule.minAge,
            maxAge: rule.maxAge,
            baseRate: rule.baseRate,
            fixedPremium: rule.fixedPremium,
            multiplier: rule.multiplier,
            reductionRate: rule.reductionRate,
            ratePercentage: rule.ratePercentage,
            franchiseRate: rule.franchiseRate,
            minCapital: rule.minCapital,
            maxCapital: rule.maxCapital,
            minMarketValue: rule.minMarketValue,
            maxMarketValue: rule.maxMarketValue,
            usageId: rule.usageId,
            referenceValue: rule.referenceValue,
            validFrom: new Date(),
            validTo: rule.validTo,
          },
        });
        createdRules.push(newRule);
        
        await this.auditService.log(
          userId,
          'PRICING_RULE_COPIED',
          'PricingRule',
          newRule.id,
          null,
          { sourceRuleId: rule.id, targetCompanyId },
        );
      }
    }

    return { success: true, count: createdRules.length };
  }
}
