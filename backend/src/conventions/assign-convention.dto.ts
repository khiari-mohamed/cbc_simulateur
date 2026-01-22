import { IsUUID } from 'class-validator';

export class AssignConventionDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  conventionId: string;
}
