import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DcCapitalTiersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dcCapitalTier.findMany({
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        usage: {
          select: { id: true, code: true, nameFr: true },
        },
      },
      orderBy: [
        { companyId: 'asc' },
        { usageId: 'asc' },
        { minAmount: 'asc' },
      ],
    });
  }

  async findByCompanyAndUsage(companyId: string, usageId: string) {
    return this.prisma.dcCapitalTier.findMany({
      where: {
        companyId,
        usageId,
        isActive: true,
      },
      orderBy: { minAmount: 'asc' },
    });
  }

  async findOne(id: string) {
    const tier = await this.prisma.dcCapitalTier.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        usage: {
          select: { id: true, code: true, nameFr: true },
        },
      },
    });

    if (!tier) {
      throw new NotFoundException('DC Capital Tier not found');
    }

    return tier;
  }

  async create(data: {
    companyId: string;
    usageId: string;
    minAmount: number;
    maxAmount?: number;
    step: number;
  }) {
    try {
      return await this.prisma.dcCapitalTier.create({
        data,
        include: {
          company: {
            select: { id: true, name: true, code: true },
          },
          usage: {
            select: { id: true, code: true, nameFr: true },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Un palier avec cette compagnie, usage et montant minimum existe déjà',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      minAmount?: number;
      maxAmount?: number;
      step?: number;
    },
  ) {
    return this.prisma.dcCapitalTier.update({
      where: { id },
      data,
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        usage: {
          select: { id: true, code: true, nameFr: true },
        },
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.dcCapitalTier.update({
      where: { id },
      data: { isActive: false },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        usage: {
          select: { id: true, code: true, nameFr: true },
        },
      },
    });
  }

  async reactivate(id: string) {
    return this.prisma.dcCapitalTier.update({
      where: { id },
      data: { isActive: true },
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
        usage: {
          select: { id: true, code: true, nameFr: true },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.dcCapitalTier.delete({
      where: { id },
    });
  }

  async copyToCompanies(sourceTierId: string, targetCompanyIds: string[]) {
    const source = await this.findOne(sourceTierId);
    const results = [];
    const updated = [];
    const errors = [];

    for (const companyId of targetCompanyIds) {
      // Skip if same company
      if (companyId === source.companyId) continue;

      try {
        // Try to create new tier
        const created = await this.prisma.dcCapitalTier.create({
          data: {
            companyId,
            usageId: source.usageId,
            minAmount: source.minAmount,
            maxAmount: source.maxAmount,
            step: source.step,
            isActive: source.isActive,
          },
          include: {
            company: {
              select: { id: true, name: true, code: true },
            },
            usage: {
              select: { id: true, code: true, nameFr: true },
            },
          },
        });
        results.push(created);
      } catch (error: any) {
        // If duplicate (P2002), update the existing tier instead
        if (error.code === 'P2002') {
          try {
            // Find the existing tier
            const existing = await this.prisma.dcCapitalTier.findFirst({
              where: {
                companyId,
                usageId: source.usageId,
                minAmount: source.minAmount,
              },
            });

            if (existing) {
              // Update it with new values
              const updatedTier = await this.prisma.dcCapitalTier.update({
                where: { id: existing.id },
                data: {
                  maxAmount: source.maxAmount,
                  step: source.step,
                  isActive: source.isActive,
                },
                include: {
                  company: {
                    select: { id: true, name: true, code: true },
                  },
                  usage: {
                    select: { id: true, code: true, nameFr: true },
                  },
                },
              });
              updated.push(updatedTier);
            }
          } catch (updateError) {
            errors.push({ companyId, reason: 'update_failed' });
          }
        } else {
          errors.push({ companyId, reason: 'error' });
        }
      }
    }

    return { created: results, updated, skipped: errors };
  }
}
