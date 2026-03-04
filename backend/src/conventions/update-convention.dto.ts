import { IsString, MinLength, MaxLength, IsOptional, IsDateString, IsArray, IsUUID, IsEnum } from 'class-validator';
import { ConventionStatus } from '@prisma/client';

export class UpdateConventionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  companyIds?: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ConventionStatus)
  status?: ConventionStatus;
}
