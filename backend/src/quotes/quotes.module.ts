import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { PricingEngineModule } from '../pricing-engine/pricing-engine.module';
import { PdfModule } from '../pdf/pdf.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, PricingEngineModule, PdfModule, NotificationsModule],
  providers: [QuotesService],
  controllers: [QuotesController],
  exports: [QuotesService],
})
export class QuotesModule {}
