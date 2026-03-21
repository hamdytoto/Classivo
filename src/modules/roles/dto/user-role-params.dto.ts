import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UserRoleParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roleId!: string;
}
