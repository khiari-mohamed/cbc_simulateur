import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateGuaranteeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameFr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;
}
