import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { GuaranteeAvailabilityStatus, FormulaType } from '@prisma/client';

export class CreateGuaranteeAvailabilityDto {
  @IsNotEmpty({ message: 'Company ID is required' })
  @IsString()
  companyId: string;

  @IsNotEmpty({ message: 'Guarantee ID is required' })
  @IsString()
  guaranteeId: string;

  @IsOptional()
  @IsEnum(FormulaType, { message: 'Invalid formula type' })
  formulaType?: FormulaType | null;

  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(GuaranteeAvailabilityStatus, { message: 'Invalid status. Must be GRATUIT, NON_ACCORDEE, or DEFAULT' })
  status: GuaranteeAvailabilityStatus;
}

export class UpdateGuaranteeAvailabilityDto {
  @IsOptional()
  @IsEnum(GuaranteeAvailabilityStatus, { message: 'Invalid status. Must be GRATUIT, NON_ACCORDEE, or DEFAULT' })
  status?: GuaranteeAvailabilityStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(FormulaType, { message: 'Invalid formula type' })
  formulaType?: FormulaType | null;
}
