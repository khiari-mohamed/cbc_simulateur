import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.company.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        conventions: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
        _count: {
          select: {
            pricingRules: true,
            quotes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        conventions: { where: { isActive: true } },
        pricingRules: {
          where: { isActive: true },
          include: { guarantee: true },
        },
      },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async create(data: { name: string; code: string }, userId: string) {
    const existing = await this.prisma.company.findFirst({
      where: {
        OR: [
          { name: data.name },
          { code: data.code },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Company name or code already exists');
    }

    const company = await this.prisma.company.create({ data });

    await this.auditService.log(
      userId,
      'COMPANY_CREATED',
      'Company',
      company.id,
      null,
      { name: company.name, code: company.code },
    );

    return company;
  }

  async update(id: string, data: { name?: string }, userId: string) {
    const existing = await this.findById(id);

    if (data.name && data.name !== existing.name) {
      const duplicate = await this.prisma.company.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictException('Company name already exists');
      }
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data,
    });

    await this.auditService.log(
      userId,
      'COMPANY_UPDATED',
      'Company',
      id,
      { name: existing.name },
      { name: updated.name },
    );

    return updated;
  }

  async deactivate(id: string, userId: string) {
    const company = await this.findById(id);

    const updated = await this.prisma.company.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log(
      userId,
      'COMPANY_DEACTIVATED',
      'Company',
      id,
      { isActive: true },
      { isActive: false },
    );

    return updated;
  }

  async reactivate(id: string, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data: { isActive: true },
    });

    await this.auditService.log(
      userId,
      'COMPANY_REACTIVATED',
      'Company',
      id,
      { isActive: false },
      { isActive: true },
    );

    return updated;
  }
}
