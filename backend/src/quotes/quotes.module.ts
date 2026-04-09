import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { PricingEngineModule } from '../pricing-engine/pricing-engine.module';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FormulaEligibilityModule } from '../formula-eligibility/formula-eligibility.module';

@Module({
  imports: [PrismaModule, PricingEngineModule, PdfModule, NotificationsModule, FormulaEligibilityModule],
  providers: [QuotesService],
  controllers: [QuotesController],
  exports: [QuotesService],
})
export class QuotesModule {}
