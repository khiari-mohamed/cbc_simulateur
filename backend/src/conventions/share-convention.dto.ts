import { IsArray, IsUUID } from 'class-validator';

export class ShareConventionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  organizationIds: string[];
}
