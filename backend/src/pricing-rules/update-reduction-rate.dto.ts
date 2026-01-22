import { IsNumber, Min, Max } from 'class-validator';

export class UpdateReductionRateDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  reductionRate: number;
}
