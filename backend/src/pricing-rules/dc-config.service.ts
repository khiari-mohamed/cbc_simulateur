import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsageType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DcConfigService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(companyId?: string, usageType?: UsageType) {
    return this.prisma.dcConfig.findMany({
      where: {
        ...(companyId && { companyId }),
        ...(usageType && { usageType }),
        isActive: true,
      },
      include: { company: true },
    });
  }

  async findById(id: string) {
    const config = await this.prisma.dcConfig.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!config) throw new NotFoundException('DC Config not found');
    return config;
  }

  async create(data: {
    companyId: string;
    usageType: UsageType;
    useMatrix?: boolean;
    franchise?: number;
    minCapital?: number;
    maxCapitalPercent?: number;
    maxCapitalAbsolute?: number;
    basePremium?: number;
    discountPercent?: number;
  }, userId: string) {
    const config = await this.prisma.dcConfig.create({
      data: {
        companyId: data.companyId,
        usageType: data.usageType,
        useMatrix: data.useMatrix ?? false,
        franchise: data.franchise !== undefined ? new Decimal(data.franchise) : new Decimal(0),
        minCapital: data.minCapital !== undefined ? new Decimal(data.minCapital) : new Decimal(1000),
        maxCapitalPercent: data.maxCapitalPercent !== undefined ? new Decimal(data.maxCapitalPercent) : new Decimal(50),
        maxCapitalAbsolute: data.maxCapitalAbsolute !== undefined ? new Decimal(data.maxCapitalAbsolute) : new Decimal(100000),
        basePremium: data.basePremium !== undefined ? new Decimal(data.basePremium) : new Decimal(10),
        discountPercent: data.discountPercent !== undefined ? new Decimal(data.discountPercent) : new Decimal(0),
      },
      include: { company: true },
    });

    await this.auditService.log(userId, 'DC_CONFIG_CREATED', 'DcConfig', config.id, null, data);
    return config;
  }

  async update(id: string, data: {
    useMatrix?: boolean;
    franchise?: number;
    minCapital?: number;
    maxCapitalPercent?: number;
    maxCapitalAbsolute?: number;
    basePremium?: number;
    discountPercent?: number;
  }, userId: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.dcConfig.update({
      where: { id },
      data: {
        ...(data.useMatrix !== undefined && { useMatrix: data.useMatrix }),
        ...(data.franchise !== undefined && { franchise: new Decimal(data.franchise) }),
        ...(data.minCapital !== undefined && { minCapital: new Decimal(data.minCapital) }),
        ...(data.maxCapitalPercent !== undefined && { maxCapitalPercent: new Decimal(data.maxCapitalPercent) }),
        ...(data.maxCapitalAbsolute !== undefined && { maxCapitalAbsolute: new Decimal(data.maxCapitalAbsolute) }),
        ...(data.basePremium !== undefined && { basePremium: new Decimal(data.basePremium) }),
        ...(data.discountPercent !== undefined && { discountPercent: new Decimal(data.discountPercent) }),
      },
      include: { company: true },
    });

    await this.auditService.log(userId, 'DC_CONFIG_UPDATED', 'DcConfig', id, existing, updated);
    return updated;
  }

  async deactivate(id: string, userId: string) {
    const config = await this.findById(id);
    const updated = await this.prisma.dcConfig.update({
      where: { id },
      data: { isActive: false },
    });
    await this.auditService.log(userId, 'DC_CONFIG_DEACTIVATED', 'DcConfig', id, { isActive: true }, { isActive: false });
    return updated;
  }

  // Capital Tiers
  async findCapitalTiers(companyId: string, usageType: UsageType) {
    return this.prisma.dcCapitalTier.findMany({
      where: { companyId, usageType, isActive: true },
      orderBy: { minAmount: 'asc' },
    });
  }

  async createCapitalTier(data: {
    companyId: string;
    usageType: UsageType;
    minAmount: number;
    maxAmount?: number;
    step: number;
  }, userId: string) {
    const tier = await this.prisma.dcCapitalTier.create({
      data: {
        companyId: data.companyId,
        usageType: data.usageType,
        minAmount: new Decimal(data.minAmount),
        maxAmount: data.maxAmount !== undefined ? new Decimal(data.maxAmount) : null,
        step: new Decimal(data.step),
      },
    });
    await this.auditService.log(userId, 'DC_CAPITAL_TIER_CREATED', 'DcCapitalTier', tier.id, null, data);
    return tier;
  }

  async updateCapitalTier(id: string, data: {
    minAmount?: number;
    maxAmount?: number;
    step?: number;
  }, userId: string) {
    const updated = await this.prisma.dcCapitalTier.update({
      where: { id },
      data: {
        ...(data.minAmount !== undefined && { minAmount: new Decimal(data.minAmount) }),
        ...(data.maxAmount !== undefined && { maxAmount: new Decimal(data.maxAmount) }),
        ...(data.step !== undefined && { step: new Decimal(data.step) }),
      },
    });
    await this.auditService.log(userId, 'DC_CAPITAL_TIER_UPDATED', 'DcCapitalTier', id, null, updated);
    return updated;
  }

  async deleteCapitalTier(id: string, userId: string) {
    await this.prisma.dcCapitalTier.delete({ where: { id } });
    await this.auditService.log(userId, 'DC_CAPITAL_TIER_DELETED', 'DcCapitalTier', id, null, null);
  }

  // Progressive Tiers
  async findProgressiveTiers(companyId: string, usageType: UsageType) {
    return this.prisma.dcProgressiveTier.findMany({
      where: { companyId, usageType, isActive: true },
      orderBy: { tierNumber: 'asc' },
    });
  }

  async createProgressiveTier(data: {
    companyId: string;
    usageType: UsageType;
    tierNumber: number;
    tierRate: number;
  }, userId: string) {
    const tier = await this.prisma.dcProgressiveTier.create({
      data: {
        companyId: data.companyId,
        usageType: data.usageType,
        tierNumber: data.tierNumber,
        tierRate: new Decimal(data.tierRate),
      },
    });
    await this.auditService.log(userId, 'DC_PROGRESSIVE_TIER_CREATED', 'DcProgressiveTier', tier.id, null, data);
    return tier;
  }

  async updateProgressiveTier(id: string, data: { tierRate?: number }, userId: string) {
    const updated = await this.prisma.dcProgressiveTier.update({
      where: { id },
      data: {
        ...(data.tierRate !== undefined && { tierRate: new Decimal(data.tierRate) }),
      },
    });
    await this.auditService.log(userId, 'DC_PROGRESSIVE_TIER_UPDATED', 'DcProgressiveTier', id, null, updated);
    return updated;
  }

  async deleteProgressiveTier(id: string, userId: string) {
    await this.prisma.dcProgressiveTier.delete({ where: { id } });
    await this.auditService.log(userId, 'DC_PROGRESSIVE_TIER_DELETED', 'DcProgressiveTier', id, null, null);
  }

  // Matrix VV Ranges
  async findMatrixVvRanges(companyId: string, usageType: UsageType) {
    return this.prisma.dcMatrixVvRange.findMany({
      where: { companyId, usageType, isActive: true },
      orderBy: { minVv: 'asc' },
    });
  }

  async createMatrixVvRange(data: {
    companyId: string;
    usageType: UsageType;
    minVv: number;
    maxVv?: number;
  }, userId: string) {
    const range = await this.prisma.dcMatrixVvRange.create({
      data: {
        companyId: data.companyId,
        usageType: data.usageType,
        minVv: new Decimal(data.minVv),
        maxVv: data.maxVv !== undefined ? new Decimal(data.maxVv) : null,
      },
    });
    await this.auditService.log(userId, 'DC_MATRIX_VV_RANGE_CREATED', 'DcMatrixVvRange', range.id, null, data);
    return range;
  }

  async updateMatrixVvRange(id: string, data: {
    minVv?: number;
    maxVv?: number;
  }, userId: string) {
    const updated = await this.prisma.dcMatrixVvRange.update({
      where: { id },
      data: {
        ...(data.minVv !== undefined && { minVv: new Decimal(data.minVv) }),
        ...(data.maxVv !== undefined && { maxVv: data.maxVv !== null ? new Decimal(data.maxVv) : null }),
      },
    });
    await this.auditService.log(userId, 'DC_MATRIX_VV_RANGE_UPDATED', 'DcMatrixVvRange', id, null, updated);
    return updated;
  }

  async deleteMatrixVvRange(id: string, userId: string) {
    await this.prisma.dcMatrixVvRange.delete({ where: { id } });
    await this.auditService.log(userId, 'DC_MATRIX_VV_RANGE_DELETED', 'DcMatrixVvRange', id, null, null);
  }

  // Matrix Capitals
  async findMatrixCapitals(companyId: string, usageType: UsageType) {
    return this.prisma.dcMatrixCapital.findMany({
      where: { companyId, usageType, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async createMatrixCapital(data: {
    companyId: string;
    usageType: UsageType;
    amount: number;
    order: number;
  }, userId: string) {
    const capital = await this.prisma.dcMatrixCapital.create({
      data: {
        companyId: data.companyId,
        usageType: data.usageType,
        amount: new Decimal(data.amount),
        order: data.order,
      },
    });
    await this.auditService.log(userId, 'DC_MATRIX_CAPITAL_CREATED', 'DcMatrixCapital', capital.id, null, data);
    return capital;
  }

  async updateMatrixCapital(id: string, data: {
    amount?: number;
    order?: number;
  }, userId: string) {
    const updated = await this.prisma.dcMatrixCapital.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: new Decimal(data.amount) }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });
    await this.auditService.log(userId, 'DC_MATRIX_CAPITAL_UPDATED', 'DcMatrixCapital', id, null, updated);
    return updated;
  }

  async deleteMatrixCapital(id: string, userId: string) {
    await this.prisma.dcMatrixCapital.delete({ where: { id } });
    await this.auditService.log(userId, 'DC_MATRIX_CAPITAL_DELETED', 'DcMatrixCapital', id, null, null);
  }

  // Matrix Prices
  async findMatrixPrices(companyId: string, usageType: UsageType) {
    return this.prisma.dcMatrixPrice.findMany({
      where: { companyId, usageType },
      include: { vvRange: true, capital: true },
    });
  }

  async upsertMatrixPrice(data: {
    companyId: string;
    usageType: UsageType;
    vvRangeId: string;
    capitalId: string;
    prime: number;
  }, userId: string) {
    // Validate companyId and usageType match
    const vvRange = await this.prisma.dcMatrixVvRange.findUnique({ where: { id: data.vvRangeId } });
    const capital = await this.prisma.dcMatrixCapital.findUnique({ where: { id: data.capitalId } });
    
    if (!vvRange || vvRange.companyId !== data.companyId || vvRange.usageType !== data.usageType) {
      throw new BadRequestException('VV Range does not belong to this company and usage');
    }
    if (!capital || capital.companyId !== data.companyId || capital.usageType !== data.usageType) {
      throw new BadRequestException('Capital does not belong to this company and usage');
    }

    const price = await this.prisma.dcMatrixPrice.upsert({
      where: {
        vvRangeId_capitalId: {
          vvRangeId: data.vvRangeId,
          capitalId: data.capitalId,
        },
      },
      create: {
        companyId: data.companyId,
        usageType: data.usageType,
        vvRangeId: data.vvRangeId,
        capitalId: data.capitalId,
        prime: new Decimal(data.prime),
      },
      update: {
        prime: new Decimal(data.prime),
      },
    });
    await this.auditService.log(userId, 'DC_MATRIX_PRICE_UPSERTED', 'DcMatrixPrice', price.id, null, data);
    return price;
  }
}
