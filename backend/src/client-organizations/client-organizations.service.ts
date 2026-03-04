import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientOrganizationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    return this.prisma.clientOrganization.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            conventions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const org = await this.prisma.clientOrganization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        joinKey: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        users: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
        conventions: {
          include: {
            companies: {
              include: { company: true },
            },
          },
        },
      },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async create(data: { name: string; code: string; joinKey: string }, userId: string) {
    const existing = await this.prisma.clientOrganization.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });

    if (existing) {
      throw new ConflictException('Organization name or code already exists');
    }

    const hashedJoinKey = await bcrypt.hash(data.joinKey, 10);

    const org = await this.prisma.clientOrganization.create({ 
      data: {
        name: data.name,
        code: data.code,
        joinKey: hashedJoinKey,
      },
    });

    await this.auditService.log(
      userId,
      'ORGANIZATION_CREATED',
      'ClientOrganization',
      org.id,
      null,
      { name: org.name, code: org.code },
    );

    return { id: org.id, name: org.name, code: org.code, isActive: org.isActive };
  }

  async update(id: string, data: { name?: string; code?: string }, userId: string) {
    const existing = await this.findById(id);

    const updated = await this.prisma.clientOrganization.update({
      where: { id },
      data,
    });

    await this.auditService.log(
      userId,
      'ORGANIZATION_UPDATED',
      'ClientOrganization',
      id,
      { name: existing.name },
      { name: updated.name },
    );

    return { id: updated.id, name: updated.name, code: updated.code, isActive: updated.isActive };
  }

  async rotateJoinKey(id: string, newJoinKey: string, userId: string) {
    await this.findById(id);

    const hashedJoinKey = await bcrypt.hash(newJoinKey, 10);

    await this.prisma.clientOrganization.update({
      where: { id },
      data: { joinKey: hashedJoinKey },
    });

    await this.auditService.log(
      userId,
      'ORGANIZATION_JOIN_KEY_ROTATED',
      'ClientOrganization',
      id,
      null,
      { rotated: true },
    );

    return { success: true };
  }

  async validateJoinKey(code: string, joinKey: string): Promise<string | null> {
    const org = await this.prisma.clientOrganization.findUnique({
      where: { code, isActive: true },
      select: { id: true, joinKey: true },
    });

    if (!org) return null;

    const isValid = await bcrypt.compare(joinKey, org.joinKey);
    return isValid ? org.id : null;
  }

  async deactivate(id: string, userId: string) {
    await this.findById(id);

    const updated = await this.prisma.clientOrganization.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log(
      userId,
      'ORGANIZATION_DEACTIVATED',
      'ClientOrganization',
      id,
      { isActive: true },
      { isActive: false },
    );

    return { id: updated.id, name: updated.name, code: updated.code, isActive: updated.isActive };
  }
}
