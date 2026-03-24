import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateFranchiseValueDto, UpdateFranchiseValueDto } from './dto/franchise-value.dto';

@Injectable()
export class FranchiseValuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.franchiseValue.findMany({
      where: { isActive: true },
      orderBy: { value: 'asc' },
    });
  }

  async findOne(id: string) {
    const franchise = await this.prisma.franchiseValue.findFirst({
      where: { id, isActive: true },
    });
    if (!franchise) {
      throw new NotFoundException(`Franchise value with ID ${id} not found`);
    }
    return franchise;
  }

  async create(data: CreateFranchiseValueDto, userId: string) {
    // Validate percentage range
    this.validateValue(data.value);

    try {
      // Attempt to create the record
      const result = await this.prisma.franchiseValue.create({
        data: {
          value: new Decimal(data.value),
          label: data.label,
          description: data.description,
          isStandard: data.isStandard ?? false,
        },
      });

      // Audit log
      await this.auditService.log(
        userId,
        'FRANCHISE_VALUE_CREATED',
        'FranchiseValue',
        result.id,
        null,
        { value: data.value, label: data.label, description: data.description, isStandard: data.isStandard },
      );

      return result;
    } catch (error) {
      // Handle unique constraint violation (value already exists)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Franchise value ${data.value}% already exists`);
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateFranchiseValueDto, userId: string) {
    // If value is being updated, validate range
    if (data.value !== undefined) {
      this.validateValue(data.value);
    }

    try {
      // Fetch the current state for audit (old values)
      const oldRecord = await this.prisma.franchiseValue.findUnique({ where: { id } });
      if (!oldRecord) {
        throw new NotFoundException(`Franchise value with ID ${id} not found`);
      }

      // Perform the update (Prisma will throw P2002 if unique constraint violated)
      const updated = await this.prisma.franchiseValue.update({
        where: { id },
        data: {
          ...(data.value !== undefined && { value: new Decimal(data.value) }),
          ...(data.label !== undefined && { label: data.label }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isStandard !== undefined && { isStandard: data.isStandard }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      // Prepare changes for audit (only fields that were actually updated)
      const changes: Record<string, any> = {};
      if (data.value !== undefined) changes.value = { old: oldRecord.value.toString(), new: updated.value.toString() };
      if (data.label !== undefined) changes.label = { old: oldRecord.label, new: updated.label };
      if (data.description !== undefined) changes.description = { old: oldRecord.description, new: updated.description };
      if (data.isStandard !== undefined) changes.isStandard = { old: oldRecord.isStandard, new: updated.isStandard };
      if (data.isActive !== undefined) changes.isActive = { old: oldRecord.isActive, new: updated.isActive };

      await this.auditService.log(
        userId,
        'FRANCHISE_VALUE_UPDATED',
        'FranchiseValue',
        id,
        oldRecord,
        changes,
      );

      return updated;
    } catch (error) {
      // Handle unique constraint violation (value already exists on another record)
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Franchise value ${data.value}% already exists`);
      }
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      // Soft delete: set isActive to false
      const updated = await this.prisma.franchiseValue.update({
        where: { id },
        data: { isActive: false },
      });

      await this.auditService.log(
        userId,
        'FRANCHISE_VALUE_DEACTIVATED',
        'FranchiseValue',
        id,
        { isActive: true },
        { isActive: false },
      );

      return updated;
    } catch (error) {
      // If record doesn't exist, Prisma throws P2025
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Franchise value with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Private validation helper
  private validateValue(value: number) {
    // Check for NaN, Infinity, -Infinity
    if (!Number.isFinite(value)) {
      throw new BadRequestException('Invalid franchise value');
    }
    // Check range 0-100
    if (value < 0 || value > 100) {
      throw new BadRequestException('Franchise value must be between 0 and 100');
    }
  }
}