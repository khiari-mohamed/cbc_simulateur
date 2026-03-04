import { Module } from '@nestjs/common';
import { PricingRulesService } from './pricing-rules.service';
import { DcConfigService } from './dc-config.service';
import { PricingRulesController } from './pricing-rules.controller';
import { DcConfigController } from './dc-config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PricingRulesController, DcConfigController],
  providers: [PricingRulesService, DcConfigService],
  exports: [PricingRulesService, DcConfigService],
})
export class PricingRulesModule {}
