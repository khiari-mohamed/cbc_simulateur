import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class FeeConfigDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsNumber()
  @Min(0)
  contractFees: number;

  @IsNumber()
  @Min(0)
  fpac: number;

  @IsNumber()
  @Min(0)
  fssr: number;

  @IsNumber()
  @Min(0)
  fg: number;
}
