import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriverProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: {
    birthDate: Date;
    licenseDate: Date;
    experienceYears: number;
  }) {
    return this.prisma.driverProfile.create({
      data: { userId, ...data },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.driverProfile.findUnique({
      where: { userId },
    });
  }

  async update(userId: string, data: {
    birthDate?: Date | string;
    licenseDate?: Date | string;
    experienceYears?: number;
  }) {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      throw new NotFoundException('Driver profile not found');
    }
    return this.prisma.driverProfile.update({
      where: { userId },
      data,
    });
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  calculateDrivingExperience(licenseDate: Date): number {
    const today = new Date();
    const license = new Date(licenseDate);
    return Math.floor((today.getTime() - license.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }
}
