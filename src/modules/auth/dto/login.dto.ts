import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
} from 'class-validator';
import { ExactlyOneOf } from 'src/common/validators/exatly-one-of.validator';
export class LoginDto {
  @ExactlyOneOf(['email', 'phone'], {
    message: 'Provide either email or phone, but not both',
  })
  private readonly _identifierCheck!: never;

  @ApiPropertyOptional({ example: 'admin@classivo.local' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+201000000000' })
  @IsOptional()
  @IsString()
  @Length(6, 20)
  @Matches(/^\+?[0-9]+$/, { message: 'phone must contain only digits and +' })
  phone?: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'ChangeMe123!' })
  @IsString()
  @Length(8, 72)
  @IsStrongPassword()
  password!: string;
}