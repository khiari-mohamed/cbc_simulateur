import { IsString, MinLength, MaxLength, IsUUID, IsOptional, IsDateString, IsArray, IsEnum } from 'class-validator';
import { ConventionStatus } from '@prisma/client';

export class CreateConventionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsUUID()
  organizationId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  companyIds: string[];

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
