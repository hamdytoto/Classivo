import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { AtLeastOneOf } from '../../../common/validators/at-least-one-of.validator';

export class UpdateRoleDto {
  @AtLeastOneOf(['code', 'name'], {
    message: 'Provide at least one field to update',
  })
  private readonly _atLeastOneField?: never;

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
