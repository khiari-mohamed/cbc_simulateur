import { PartialType } from '@nestjs/mapped-types';
import { CreateBgCapitalLimitDto } from './create-bg-capital-limit.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBgCapitalLimitDto extends PartialType(CreateBgCapitalLimitDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
