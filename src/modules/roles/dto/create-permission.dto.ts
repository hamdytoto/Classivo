import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users.manage' })
  @IsString()
  @Length(3, 80)
  @Matches(/^[a-z0-9._]+$/, {
    message:
      'code must contain lowercase letters, numbers, dots, or underscores',
  })
  code!: string;

  @ApiProperty({ example: 'Manage users' })
  @IsString()
  @Length(2, 100)
  name!: string;
}

