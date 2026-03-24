import { PartialType } from '@nestjs/mapped-types';
import { CreateUsageTypeDto } from './create-usage-type.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUsageTypeDto extends PartialType(CreateUsageTypeDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
