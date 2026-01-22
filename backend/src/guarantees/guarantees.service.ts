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
  }, userId: string) {
    const existing = await this.prisma.guarantee.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException('Guarantee code already exists');
    }

    const guarantee = await this.prisma.guarantee.create({ data });

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
  }, userId: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.guarantee.update({
      where: { id },
      data,
    });

    await this.auditService.log(
      userId,
      'GUARANTEE_UPDATED',
      'Guarantee',
      id,
      { nameFr: existing.nameFr, isOptional: existing.isOptional },
      { nameFr: updated.nameFr, isOptional: updated.isOptional },
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
}
