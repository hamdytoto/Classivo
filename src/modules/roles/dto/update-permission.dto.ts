import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'users.manage' })
  @IsOptional()
  @IsString()
  @Length(3, 80)
  @Matches(/^[a-z0-9._]+$/, {
    message:
      'code must contain lowercase letters, numbers, dots, or underscores',
  })
  code?: string;

  @ApiPropertyOptional({ example: 'Manage users' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;
}

