import { IsDateString, IsInt, Min, Max } from 'class-validator';

export class CreateDriverProfileDto {
  @IsDateString()
  birthDate: string;

  @IsDateString()
  licenseDate: string;

  @IsInt()
  @Min(0)
  @Max(70)
  experienceYears: number;
}
