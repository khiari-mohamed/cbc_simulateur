import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(contractId: string, amount: any, method: string) {
    return this.prisma.payment.create({
      data: { contractId, amount, method, status: 'PENDING' },
    });
  }
}
