import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Z0-9_]+$/, { message: 'Code must be uppercase alphanumeric with underscores' })
  code: string;
}
