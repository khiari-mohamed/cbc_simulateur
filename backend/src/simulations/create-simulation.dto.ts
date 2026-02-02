import { IsEnum, IsNumber, IsOptional, IsUUID, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FormulaType, UsageType } from '@prisma/client';
import { CreateVehicleDto } from '../vehicles/create-vehicle.dto';

export class CreateSimulationDto {
  @ValidateNested()
  @Type(() => CreateVehicleDto)
  vehicle: CreateVehicleDto;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(8)
  bonusMalus: number;

  @IsEnum(UsageType)
  usage: UsageType;

  @IsEnum(FormulaType)
  formulaType: FormulaType;

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
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1000)
  dcCapital?: number;
}
