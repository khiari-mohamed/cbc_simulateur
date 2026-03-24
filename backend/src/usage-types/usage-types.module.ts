import { Module } from '@nestjs/common';
import { UsageTypesService } from './usage-types.service';
import { UsageTypesController } from './usage-types.controller';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuditModule, PrismaModule],
  providers: [UsageTypesService],
  controllers: [UsageTypesController],
  exports: [UsageTypesService],
})
export class UsageTypesModule {}
