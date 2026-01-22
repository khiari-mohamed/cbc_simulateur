import { Module } from '@nestjs/common';
import { PricingRulesService } from './pricing-rules.service';
import { PricingRulesController } from './pricing-rules.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PricingRulesController],
  providers: [PricingRulesService],
  exports: [PricingRulesService],
})
export class PricingRulesModule {}
