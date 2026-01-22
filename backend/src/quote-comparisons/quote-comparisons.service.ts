import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuoteComparisonsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, quoteIds: string[]) {
    const quotes = await this.prisma.quote.findMany({
      where: { id: { in: quoteIds }, userId },
      include: { company: true, items: { include: { guarantee: true } } },
    });

    if (quotes.length !== quoteIds.length) {
      throw new NotFoundException('One or more quotes not found');
    }

    return this.prisma.quoteComparison.create({
      data: {
        userId,
        quotes: { connect: quoteIds.map(id => ({ id })) },
      },
      include: {
        quotes: {
          include: {
            company: true,
            items: { include: { guarantee: true } },
            simulation: { include: { vehicle: true } },
          },
        },
      },
    });
  }

  async findById(id: string) {
    const comparison = await this.prisma.quoteComparison.findUnique({
      where: { id },
      include: {
        quotes: {
          include: {
            company: true,
            items: { include: { guarantee: true } },
            simulation: { include: { vehicle: true } },
          },
        },
      },
    });

    if (!comparison) {
      throw new NotFoundException('Comparison not found');
    }

    return comparison;
  }

  async findByUser(userId: string) {
    return this.prisma.quoteComparison.findMany({
      where: { userId },
      include: {
        quotes: {
          select: {
            id: true,
            quoteNumber: true,
            totalAPayer: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }


}
