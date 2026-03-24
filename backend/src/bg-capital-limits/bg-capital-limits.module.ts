import { Module } from '@nestjs/common';
import { BgCapitalLimitsService } from './bg-capital-limits.service';
import { BgCapitalLimitsController } from './bg-capital-limits.controller';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuditModule, PrismaModule],
  providers: [BgCapitalLimitsService],
  controllers: [BgCapitalLimitsController],
  exports: [BgCapitalLimitsService],
})
export class BgCapitalLimitsModule {}
