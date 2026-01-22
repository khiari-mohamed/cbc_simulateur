import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    registration?: string;
    fiscalHorsepower: number;
    numberOfSeats: number;
    newValue: number | Decimal;
    marketValue: number | Decimal;
    firstCirculationDate: Date | string;
  }) {
    const firstCirculation = new Date(data.firstCirculationDate);
    const now = new Date();

    if (firstCirculation > now) {
      throw new BadRequestException('First circulation date cannot be in the future');
    }

    if (typeof data.newValue === 'number' && typeof data.marketValue === 'number') {
      if (data.marketValue > data.newValue) {
        throw new BadRequestException('Market value cannot exceed new value');
      }
    }

    return this.prisma.vehicle.create({
      data: {
        registration: data.registration,
        fiscalHorsepower: data.fiscalHorsepower,
        numberOfSeats: data.numberOfSeats,
        newValue: new Decimal(data.newValue),
        marketValue: new Decimal(data.marketValue),
        firstCirculationDate: firstCirculation,
      },
    });
  }

  async findById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        simulations: {
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async update(id: string, data: {
    registration?: string;
    newValue?: number | Decimal;
    marketValue?: number | Decimal;
  }) {
    const vehicle = await this.findById(id);

    if (data.newValue && data.marketValue) {
      if (typeof data.newValue === 'number' && typeof data.marketValue === 'number') {
        if (data.marketValue > data.newValue) {
          throw new BadRequestException('Market value cannot exceed new value');
        }
      }
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.registration && { registration: data.registration }),
        ...(data.newValue && { newValue: new Decimal(data.newValue) }),
        ...(data.marketValue && { marketValue: new Decimal(data.marketValue) }),
      },
    });
  }

  calculateVehicleAge(firstCirculationDate: Date): number {
    const now = new Date();
    const circulation = new Date(firstCirculationDate);
    let age = now.getFullYear() - circulation.getFullYear();
    const monthDiff = now.getMonth() - circulation.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < circulation.getDate())) {
      age--;
    }
    
    return age;
  }

  isEligibleForTousRisques(firstCirculationDate: Date): boolean {
    return this.calculateVehicleAge(firstCirculationDate) < 2;
  }

  isEligibleForDommagesCollision(firstCirculationDate: Date): boolean {
    return this.calculateVehicleAge(firstCirculationDate) < 10;
  }
}
