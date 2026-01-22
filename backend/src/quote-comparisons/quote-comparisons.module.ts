import { Module } from '@nestjs/common';
import { QuoteComparisonsService } from './quote-comparisons.service';
import { QuoteComparisonsController } from './quote-comparisons.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [QuoteComparisonsService],
  controllers: [QuoteComparisonsController],
  exports: [QuoteComparisonsService],
})
export class QuoteComparisonsModule {}
