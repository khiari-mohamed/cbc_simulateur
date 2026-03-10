import { Module } from '@nestjs/common';
import { PricingEngineService } from './pricing-engine.service';
import { ReductionRatesService } from './reduction-rates.service';
import { FormulaEvaluatorService } from './formula-evaluator.service';
import { GuaranteesModule } from '../guarantees/guarantees.module';

@Module({
  imports: [GuaranteesModule],
  providers: [PricingEngineService, ReductionRatesService, FormulaEvaluatorService],
  exports: [PricingEngineService, ReductionRatesService, FormulaEvaluatorService],
})
export class PricingEngineModule {}
