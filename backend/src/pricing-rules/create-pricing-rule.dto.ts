import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { FormulaType, UsageType } from '@prisma/client';

export class CreatePricingRuleDto {
  @IsString()
  companyId: string;

  @IsString()
  guaranteeId: string;

  @IsOptional()
  @IsString()
  conventionId?: string;

  @IsOptional()
  @IsEnum(FormulaType)
  formulaType?: FormulaType;

  @IsOptional()
  @IsNumber()
  minPower?: number;

  @IsOptional()
  @IsNumber()
  maxPower?: number;

  @IsOptional()
  @IsNumber()
  minAge?: number;

  @IsOptional()
  @IsNumber()
  maxAge?: number;

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
  franchiseRate?: number;

  @IsOptional()
  @IsNumber()
  minCapital?: number;

  @IsOptional()
  @IsNumber()
  maxCapital?: number;

  @IsOptional()
  @IsEnum(UsageType)
  usageType?: UsageType;

  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  validTo?: Date;
}
