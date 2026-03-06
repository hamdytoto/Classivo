import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'SCHOOL_ADMIN' })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'code must contain uppercase letters, numbers, or underscore',
  })
  code!: string;

  @ApiProperty({ example: 'School Admin' })
  @IsString()
  @Length(2, 100)
  name!: string;
}

