import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: Role;
    organizationId?: string;
    otpSecret?: string;
    otpEnabled?: boolean;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const { ...userData } = data;
    return this.prisma.user.create({ data: userData });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        driverProfile: true,
        organization: {
          include: {
            conventions: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        otpEnabled: true,
        createdAt: true,
        driverProfile: true,
        organization: {
          include: {
            conventions: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
    });
  }

  async updateRole(userId: string, role: Role) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async deactivate(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  async updateOtpSecret(userId: string, otpSecret: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { otpSecret },
    });
  }

  async updatePassword(userId: string, password: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password },
    });
  }

  async update(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async assignConvention(userId: string, conventionId: string) {
    const convention = await this.prisma.convention.findUnique({ where: { id: conventionId } });
    if (!convention) throw new Error('Convention not found');
    
    return this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: convention.organizationId },
    });
  }

  async removeConvention(userId: string, conventionId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: null },
    });
  }

  async getUserConventions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: { conventions: true },
        },
      },
    });
    return user?.organization?.conventions || [];
  }

  async toggle2FA(userId: string, enabled: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { otpEnabled: enabled },
      select: {
        id: true,
        email: true,
        otpEnabled: true,
      },
    });
  }

  async activate(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }

  async delete(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Safe deletion: if user has dependent data, perform soft-deactivate to avoid breaking references
    const deps = await this.prisma.$transaction([
      this.prisma.quote.count({ where: { userId } }),
      this.prisma.simulation.count({ where: { userId } }),
      this.prisma.contract.count({ where: { userId } }),
      this.prisma.document.count({ where: { userId } }),
    ]);
    const hasDeps = deps.some((c) => c > 0);

    if (hasDeps) {
      await this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
      return { message: 'User has dependent records; account deactivated instead of hard delete' };
    }

    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }
}
