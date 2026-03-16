import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
} from 'class-validator';

export class RegisterSchoolDto {
  @ApiProperty({ example: 'Classivo Academy' })
  @IsString()
  @Length(2, 120)
  schoolName!: string;

  @ApiProperty({ example: 'CLASSIVO' })
  @IsString()
  @Length(2, 32)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'schoolCode may contain only letters, numbers, hyphens, and underscores',
  })
  schoolCode!: string;

  @ApiProperty({ example: 'owner@classivo.dev' })
  @IsEmail()
  email!: string;

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

  @ApiProperty({ example: 'John' })
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @Length(1, 100)
  lastName!: string;
}
