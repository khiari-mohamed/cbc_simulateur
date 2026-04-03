import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateDcCapitalTierDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  step?: number;
}
