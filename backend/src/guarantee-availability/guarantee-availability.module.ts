import { Module } from '@nestjs/common';
import { GuaranteeAvailabilityController } from './guarantee-availability.controller';
import { GuaranteeAvailabilityService } from './guarantee-availability.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GuaranteeAvailabilityController],
  providers: [GuaranteeAvailabilityService],
  exports: [GuaranteeAvailabilityService],
})
export class GuaranteeAvailabilityModule {}