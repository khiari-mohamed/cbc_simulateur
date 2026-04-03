import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDcCapitalTierDto {
  @IsString()
  companyId: string;

  @IsString()
  usageId: string;

  @IsNumber()
  @Min(0)
  minAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsNumber()
  @Min(1)
  step: number;
}
