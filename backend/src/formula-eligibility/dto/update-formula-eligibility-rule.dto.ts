import { IsString, IsInt, IsBoolean, IsEnum, IsOptional, Min } from 'class-validator';
import { FormulaType } from '@prisma/client';

export class UpdateFormulaEligibilityRuleDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  usageId?: string;

  @IsOptional()
  @IsEnum(FormulaType)
  formulaType?: FormulaType;

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

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
