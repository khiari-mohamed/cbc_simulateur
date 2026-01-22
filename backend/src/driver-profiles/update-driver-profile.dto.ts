import { IsDateString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateDriverProfileDto {
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsDateString()
  licenseDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(70)
  experienceYears?: number;
}
