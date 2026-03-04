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
  @IsNumber()
  ratePercentage?: number;

  @IsOptional()
  @IsNumber()
  minCapital?: number;

  @IsOptional()
  @IsNumber()
  maxCapital?: number;

  @IsOptional()
  @IsNumber()
  franchiseRate?: number;

  @IsOptional()
  @IsDateString()
  validTo?: Date;
}
