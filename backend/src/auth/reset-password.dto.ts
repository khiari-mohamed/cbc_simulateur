import { IsString, MinLength, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
