import { IsEnum, IsDecimal, IsOptional, IsUUID, IsArray, IsString, Min, Max, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { FormulaType } from '@prisma/client';

export enum FractionnementType {
  ANNUEL = 'ANNUEL',
  SEMESTRIEL = 'SEMESTRIEL',
}

export class UpdateSimulationDto {
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0.5)
  @Max(3.5)
  bonusMalus?: number;

  @IsOptional()
  @IsString()
  usageId?: string;

  @IsOptional()
  @IsEnum(FormulaType)
  formulaType?: FormulaType;

  @IsOptional()
  @IsUUID()
  conventionId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedGuarantees?: string[];

  @IsOptional()
  @IsNumber()
  franchiseRate?: number;

  @IsOptional()
  @IsNumber()
  bgLimit?: number;

  @IsOptional()
  dcCapitals?: Record<string, number>;

  @IsOptional()
  @IsEnum(FractionnementType)
  fractionnement?: FractionnementType;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  companyIds?: string[];
}
