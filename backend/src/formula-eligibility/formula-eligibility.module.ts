import { Module } from '@nestjs/common';
import { FormulaEligibilityController } from './formula-eligibility.controller';
import { FormulaEligibilityService } from './formula-eligibility.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FormulaEligibilityController],
  providers: [FormulaEligibilityService],
  exports: [FormulaEligibilityService],
})
export class FormulaEligibilityModule {}
