import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@classivo.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit code' })
  otp!: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'ChangeMe123!' })
  @IsString()
  @Length(8, 72)
  @IsStrongPassword()
  newPassword!: string;
}
