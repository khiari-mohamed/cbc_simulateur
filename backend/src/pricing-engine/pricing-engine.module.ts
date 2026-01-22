import { Module } from '@nestjs/common';
import { PricingEngineService } from './pricing-engine.service';
import { ReductionRatesService } from './reduction-rates.service';
import { GuaranteesModule } from '../guarantees/guarantees.module';

@Module({
  imports: [GuaranteesModule],
  providers: [PricingEngineService, ReductionRatesService],
  exports: [PricingEngineService, ReductionRatesService],
})
export class PricingEngineModule {}
