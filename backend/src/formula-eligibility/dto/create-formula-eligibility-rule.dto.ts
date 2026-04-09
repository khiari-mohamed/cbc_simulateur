import { IsString, IsInt, IsBoolean, IsEnum, Min, IsOptional } from 'class-validator';
import { FormulaType } from '@prisma/client';

export class CreateFormulaEligibilityRuleDto {
  @IsString()
  companyId!: string;

  @IsString()
  usageId!: string;

  @IsEnum(FormulaType)
  formulaType!: FormulaType;

  @IsOptional()
  @IsInt()
  @Min(0)
  minAgeYears?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAgeYears?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isActive: boolean = true;
}
