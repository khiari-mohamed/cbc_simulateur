import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageFeeConfigService {
  constructor(private prisma: PrismaService) {}

  // Get all fee configs for a usage (used to display chips in the list)
  async getByUsage(usageId: string) {
    return this.prisma.usageFeeConfig.findMany({
      where: { usageId },
      include: { company: { select: { id: true, name: true, code: true } } },
    });
  }

  // Get one specific config (used by pricing engine)
  async getByUsageAndCompany(usageId: string, companyId: string) {
    return this.prisma.usageFeeConfig.findUnique({
      where: { usageId_companyId: { usageId, companyId } },
    });
  }

  // Upsert a config (create or update)
  async upsert(
    usageId: string,
    companyId: string,
    fees: {
      contractFees: number;
      fpac: number;
      fssr: number;
      fg: number;
    },
  ) {
    return this.prisma.usageFeeConfig.upsert({
      where: { usageId_companyId: { usageId, companyId } },
      create: { usageId, companyId, ...fees },
      update: { ...fees },
    });
  }

  // Delete a config (when user removes a company from a usage)
  async delete(usageId: string, companyId: string) {
    return this.prisma.usageFeeConfig.delete({
      where: { usageId_companyId: { usageId, companyId } },
    });
  }

  // Replace all configs for a usage in one transaction
  // Called when saving the usage modal (full sync)
  async syncForUsage(
    usageId: string,
    configs: Array<{
      companyId: string;
      contractFees: number;
      fpac: number;
      fssr: number;
      fg: number;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Delete all existing configs for this usage
      await tx.usageFeeConfig.deleteMany({ where: { usageId } });
      // Re-create from the submitted list
      if (configs.length > 0) {
        await tx.usageFeeConfig.createMany({
          data: configs.map((c) => ({ usageId, ...c })),
        });
      }
    });
  }

  // Auto-create configs for a new usage (copy from all companies)
  async autoCreateForNewUsage(usageId: string) {
    const companies = await this.prisma.company.findMany({
      where: { isActive: true },
    });

    if (companies.length === 0) return;

    await this.prisma.usageFeeConfig.createMany({
      data: companies.map((c) => ({
        usageId,
        companyId: c.id,
        contractFees: c.contractFees ?? 0,
        fpac: c.fpac ?? 0.5,
        fssr: c.fssr ?? 0.3,
        fg: c.fg ?? 3.0,
      })),
      skipDuplicates: true,
    });
  }

  // Auto-create configs for a new company (copy to all usages)
  async autoCreateForNewCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) return;

    const usages = await this.prisma.usage.findMany({
      where: { isActive: true },
    });

    if (usages.length === 0) return;

    await this.prisma.usageFeeConfig.createMany({
      data: usages.map((u) => ({
        usageId: u.id,
        companyId: company.id,
        contractFees: company.contractFees ?? 0,
        fpac: company.fpac ?? 0.5,
        fssr: company.fssr ?? 0.3,
        fg: company.fg ?? 3.0,
      })),
      skipDuplicates: true,
    });
  }
}
