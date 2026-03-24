import { IsString, IsOptional, IsNotEmpty, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';

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
}
