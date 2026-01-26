import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuoteStatus } from '@prisma/client';

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  async getStatistics(startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate ? {
      createdAt: { gte: startDate, lte: endDate },
    } : {};

    const [
      totalQuotes,
      generatedQuotes,
      submittedQuotes,
      validatedQuotes,
      rejectedQuotes,
      transformedQuotes,
      totalContracts,
      activeContracts,
      totalUsers,
      activeUsers,
      totalCompanies,
      totalSimulations,
    ] = await Promise.all([
      this.prisma.quote.count({ where: dateFilter }),
      this.prisma.quote.count({ where: { ...dateFilter, status: QuoteStatus.GENERATED } }),
      this.prisma.quote.count({ where: { ...dateFilter, status: QuoteStatus.SUBMITTED } }),
      this.prisma.quote.count({ where: { ...dateFilter, status: QuoteStatus.VALIDATED } }),
      this.prisma.quote.count({ where: { ...dateFilter, status: QuoteStatus.REJECTED } }),
      this.prisma.quote.count({ where: { ...dateFilter, status: QuoteStatus.TRANSFORMED_TO_CONTRACT } }),
      this.prisma.contract.count({ where: dateFilter }),
      this.prisma.contract.count({ where: { ...dateFilter, status: 'ACTIVE' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.company.count({ where: { isActive: true } }),
      this.prisma.simulation.count({ where: dateFilter }),
    ]);

    const quotesByCompany = await this.prisma.quote.groupBy({
      by: ['companyId'],
      where: dateFilter,
      _count: { id: true },
      _sum: { totalAPayer: true },
    });

    const companiesData = await this.prisma.company.findMany({
      where: { id: { in: quotesByCompany.map(q => q.companyId) } },
      select: { id: true, name: true },
    });

    const quotesByCompanyWithNames = quotesByCompany.map(q => {
      const company = companiesData.find(c => c.id === q.companyId);
      return {
        companyId: q.companyId,
        companyName: company?.name || 'Unknown',
        totalQuotes: q._count.id,
        totalRevenue: q._sum.totalAPayer || 0,
      };
    });

    const conversionRate = totalQuotes > 0 ? (transformedQuotes / totalQuotes) * 100 : 0;
    const validationRate = totalQuotes > 0 ? (validatedQuotes / totalQuotes) * 100 : 0;
    const rejectionRate = totalQuotes > 0 ? (rejectedQuotes / totalQuotes) * 100 : 0;

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      quotes: {
        total: totalQuotes,
        generated: generatedQuotes,
        submitted: submittedQuotes,
        validated: validatedQuotes,
        rejected: rejectedQuotes,
        transformed: transformedQuotes,
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      companies: {
        total: totalCompanies,
      },
      simulations: {
        total: totalSimulations,
      },
      rates: {
        conversionRate: Number(conversionRate.toFixed(2)),
        validationRate: Number(validationRate.toFixed(2)),
        rejectionRate: Number(rejectionRate.toFixed(2)),
      },
      byCompany: quotesByCompanyWithNames,
      byConvention: await this.getStatisticsByConvention(startDate, endDate),
    };
  }

  async getRevenueReport(startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate ? {
      createdAt: { gte: startDate, lte: endDate },
    } : {};

    const quotes = await this.prisma.quote.findMany({
      where: {
        ...dateFilter,
        status: QuoteStatus.TRANSFORMED_TO_CONTRACT,
      },
      select: {
        totalAPayer: true,
        primeNette: true,
        taxes: true,
        frais: true,
        company: { select: { name: true } },
        createdAt: true,
      },
    });

    const totalRevenue = quotes.reduce((sum, q) => sum + Number(q.totalAPayer), 0);
    const totalPrimeNette = quotes.reduce((sum, q) => sum + Number(q.primeNette), 0);
    const totalTaxes = quotes.reduce((sum, q) => sum + Number(q.taxes), 0);
    const totalFrais = quotes.reduce((sum, q) => sum + Number(q.frais), 0);

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalRevenue,
        totalPrimeNette,
        totalTaxes,
        totalFrais,
        totalContracts: quotes.length,
        averageContractValue: quotes.length > 0 ? totalRevenue / quotes.length : 0,
      },
      details: quotes,
    };
  }

  async getTopPerformers() {
    const topCompanies = await this.prisma.quote.groupBy({
      by: ['companyId'],
      where: { status: QuoteStatus.TRANSFORMED_TO_CONTRACT },
      _count: { id: true },
      _sum: { totalAPayer: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const companiesData = await this.prisma.company.findMany({
      where: { id: { in: topCompanies.map(c => c.companyId) } },
      select: { id: true, name: true, code: true },
    });

    return topCompanies.map(c => {
      const company = companiesData.find(comp => comp.id === c.companyId);
      return {
        company: company || { id: c.companyId, name: 'Unknown', code: 'N/A' },
        totalContracts: c._count.id,
        totalRevenue: c._sum.totalAPayer || 0,
      };
    });
  }

  async getStatisticsByConvention(startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate ? {
      createdAt: { gte: startDate, lte: endDate },
    } : {};

    const simulations = await this.prisma.simulation.findMany({
      where: {
        ...dateFilter,
        conventionId: { not: null },
      },
      include: {
        convention: {
          include: { company: true },
        },
        quotes: {
          where: { status: QuoteStatus.TRANSFORMED_TO_CONTRACT },
        },
      },
    });

    const conventionStats = simulations.reduce((acc, sim) => {
      if (!sim.conventionId || !sim.convention) return acc;

      const key = sim.conventionId;
      if (!acc[key]) {
        acc[key] = {
          conventionId: sim.conventionId,
          conventionName: sim.convention.name,
          companyName: sim.convention.company.name,
          totalSimulations: 0,
          totalContracts: 0,
          totalPremium: 0,
          quotes: [],
        };
      }

      acc[key].totalSimulations++;
      acc[key].totalContracts += sim.quotes.length;
      acc[key].totalPremium += sim.quotes.reduce((sum, q) => sum + Number(q.primeNette), 0);
      acc[key].quotes.push(...sim.quotes.map(q => ({
        quoteNumber: q.quoteNumber,
        primeNette: Number(q.primeNette),
        totalAPayer: Number(q.totalAPayer),
        createdAt: q.createdAt,
      })));

      return acc;
    }, {} as Record<string, any>);

    return Object.values(conventionStats).sort((a: any, b: any) => b.totalPremium - a.totalPremium);
  }
}
