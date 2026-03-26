import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ExactlyOneOf } from '../../../../common/validators/exatly-one-of.validator';

export class LoginDto {
  @ExactlyOneOf(['email', 'phone'], {
    message: 'Provide either email or phone, but not both',
  })
  private readonly _identifierCheck?: never;

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

  @ApiProperty({
    example: 'legacy-password',
    description:
      'The account password. Login accepts existing passwords without enforcing the current strong-password creation policy.',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
