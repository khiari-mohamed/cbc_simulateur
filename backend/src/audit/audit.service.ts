import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string | undefined,
    action: string,
    entity: string,
    entityId: string,
    oldValue?: any,
    newValue?: any,
  ) {
    return this.prisma.auditLog.create({
      data: {
        ...(userId && { userId }),
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
      },
    });
  }
}
