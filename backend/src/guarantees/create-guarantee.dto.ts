import { IsString, IsBoolean, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateGuaranteeDto {
  @IsString()
  @Matches(/^[A-Z_]+$/, { message: 'Code must be uppercase with underscores' })
  @MaxLength(50)
  code: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameFr: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameEn?: string;

  @IsBoolean()
  isOptional: boolean;
}
