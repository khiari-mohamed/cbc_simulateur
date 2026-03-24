import { IsString, IsOptional, IsNotEmpty, IsBoolean, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBgCapitalLimitDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  value: number;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isStandard?: boolean;
}
