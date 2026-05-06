import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

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
            conventions: {
              where: {
                isActive: true,
                status: 'ACTIVE',
              },
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
            sharedConventions: {
              where: {
                convention: {
                  isActive: true,
                  status: 'ACTIVE',
                },
              },
              select: {
                convention: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.organization) {
      const primaryConventions = user.organization.conventions ?? [];
      const sharedConventions = (user.organization.sharedConventions ?? []).map(
        (shared) => shared.convention,
      );
      const conventions = Array.from(
        new Map(
          [...primaryConventions, ...sharedConventions].map((convention) => [
            convention.id,
            convention,
          ]),
        ).values(),
      );

      return {
        ...user,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          code: user.organization.code,
          conventions,
        },
      };
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
        organizationId: true,
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

  async assignConvention(userId: string, conventionId: string, assignedBy?: string) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, organizationId: true, firstName: true, lastName: true, role: true }
    });
    if (!user) throw new NotFoundException('User not found');

    // Validate convention exists
    const convention = await this.prisma.convention.findUnique({ 
      where: { id: conventionId },
      include: { organization: true }
    });
    if (!convention) throw new NotFoundException('Convention not found');
    if (!convention.isActive) throw new ConflictException('Convention is not active');
    
    const oldOrgId = user.organizationId;
    
    // Update user organization
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: convention.organizationId },
    });

    // Log assignment (non-blocking)
    if (assignedBy) {
      this.auditService.log(
        assignedBy,
        'CONVENTION_ASSIGNED',
        'User',
        userId,
        { organizationId: oldOrgId },
        { 
          organizationId: convention.organizationId, 
          organizationName: convention.organization.name,
          conventionId, 
          conventionName: convention.name,
          userRole: user.role,
          userName: `${user.firstName} ${user.lastName}`
        },
      ).catch(err => console.error('Failed to log assignment:', err));
    }

    return result;
  }

  async removeConvention(userId: string, conventionId: string, removedBy?: string) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, organizationId: true, firstName: true, lastName: true, role: true, organization: { select: { name: true } } }
    });
    if (!user) throw new NotFoundException('User not found');
    if (!user.organizationId) throw new ConflictException('User has no organization assigned');

    const oldOrgId = user.organizationId;
    const oldOrgName = user.organization?.name;
    
    // Update user organization
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: null },
    });

    // Log removal (non-blocking)
    if (removedBy) {
      this.auditService.log(
        removedBy,
        'CONVENTION_REMOVED',
        'User',
        userId,
        { organizationId: oldOrgId, organizationName: oldOrgName },
        { 
          organizationId: null, 
          conventionId,
          userRole: user.role,
          userName: `${user.firstName} ${user.lastName}`
        },
      ).catch(err => console.error('Failed to log removal:', err));
    }

    return result;
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

  async reactivate(userId: string) {
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

    // Check only meaningful user data (not system logs/notifications)
    const usageCount = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            simulations: true,
            quotes: true,
            contracts: true,
          },
        },
      },
    });

    const counts = usageCount?._count;
    const totalUsage = (counts?.simulations || 0) + (counts?.quotes || 0) + (counts?.contracts || 0);

    if (totalUsage > 0) {
      const details = [];
      if (counts && counts.simulations && counts.simulations > 0) details.push(`${counts.simulations} simulation(s)`);
      if (counts && counts.quotes && counts.quotes > 0) details.push(`${counts.quotes} devis`);
      if (counts && counts.contracts && counts.contracts > 0) details.push(`${counts.contracts} contrat(s)`);
      
      const detailsText = details.length > 0 ? ` (${details.join(', ')})` : '';
      
      throw new ConflictException(
        `Impossible de supprimer cet utilisateur. Il possède ${totalUsage} enregistrement(s) associé(s)${detailsText}. Veuillez désactiver l'utilisateur au lieu de le supprimer.`
      );
    }

    // Hard delete - Prisma will cascade delete system records (auditLogs, notifications, etc.)
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted permanently' };
  }

  async getAssignmentHistory(limit: number = 100) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['CONVENTION_ASSIGNED', 'CONVENTION_REMOVED'] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 1000), // Max 1000 records
    });

    // Parse JSON fields safely
    return logs.map(log => ({
      ...log,
      oldValue: this.safeJsonParse(log.oldValue),
      newValue: this.safeJsonParse(log.newValue),
    }));
  }

  private safeJsonParse(value: string | null): any {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
