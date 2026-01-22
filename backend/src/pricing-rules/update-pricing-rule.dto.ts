import { IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdatePricingRuleDto {
  @IsOptional()
  @IsNumber()
  baseRate?: number;

  @IsOptional()
  @IsNumber()
  fixedPremium?: number;

  @IsOptional()
  @IsNumber()
  multiplier?: number;

  @IsOptional()
  @IsNumber()
  reductionRate?: number;

  @IsOptional()
  @IsDateString()
  validTo?: Date;
}
