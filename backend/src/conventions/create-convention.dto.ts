import { IsString, MinLength, MaxLength, IsUUID, IsOptional, IsNumber, Min, Max, IsDateString } from 'class-validator';

export class CreateConventionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  reductionTousRisques?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  reductionDommagesCollision?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  reductionVol?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  reductionIncendie?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
