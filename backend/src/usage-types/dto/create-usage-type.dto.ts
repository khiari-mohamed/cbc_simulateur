import { IsString, IsOptional, IsNotEmpty, Matches, Length, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FeeConfigDto } from './fee-config.dto';

export class CreateUsageTypeDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Transform(({ value }) => value?.toUpperCase().trim())
  @Matches(/^[A-Z0-9_]+$/, { message: 'Code must contain only uppercase letters, numbers, and underscores' })
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nameFr: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  nameAr?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  nameEn?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeConfigDto)
  feeConfigs?: FeeConfigDto[];
}
