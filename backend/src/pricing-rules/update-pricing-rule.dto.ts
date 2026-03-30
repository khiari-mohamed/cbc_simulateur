import { IsOptional, IsNumber, IsDateString, IsEnum, IsString } from 'class-validator';
import { ReferenceValue } from '@prisma/client';

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
  minMarketValue?: number;

  @IsOptional()
  @IsNumber()
  maxMarketValue?: number;

  @IsOptional()
  @IsNumber()
  franchiseRate?: number;

  @IsOptional()
  @IsString()
  usageId?: string;

  @IsOptional()
  @IsEnum(ReferenceValue)
  referenceValue?: ReferenceValue;

  @IsOptional()
  @IsDateString()
  validTo?: Date;
}
