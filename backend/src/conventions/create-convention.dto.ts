import { IsString, MinLength, MaxLength, IsUUID } from 'class-validator';

export class CreateConventionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsUUID()
  companyId: string;
}
