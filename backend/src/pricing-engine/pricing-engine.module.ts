import { Module } from '@nestjs/common';
import { PricingEngineService } from './pricing-engine.service';
import { ReductionRatesService } from './reduction-rates.service';
import { FormulaEvaluatorService } from './formula-evaluator.service';
import { GuaranteesModule } from '../guarantees/guarantees.module';
import { GuaranteeAvailabilityModule } from '../guarantee-availability/guarantee-availability.module';
import { UsageFeeConfigModule } from '../usage-fee-config/usage-fee-config.module';

@Module({
  imports: [GuaranteesModule, GuaranteeAvailabilityModule, UsageFeeConfigModule],
  providers: [PricingEngineService, ReductionRatesService, FormulaEvaluatorService],
  exports: [PricingEngineService, ReductionRatesService, FormulaEvaluatorService],
})
export class PricingEngineModule {}
