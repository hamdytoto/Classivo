import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'SCHOOL_ADMIN' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'code must contain uppercase letters, numbers, or underscore',
  })
  code?: string;

  @ApiPropertyOptional({ example: 'School Admin' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;
}

