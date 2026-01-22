import { IsBoolean, IsString } from 'class-validator';

export class Toggle2FADto {
  @IsString()
  userId: string;

  @IsBoolean()
  enabled: boolean;
}
