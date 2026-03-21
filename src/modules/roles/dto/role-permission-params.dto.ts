import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RolePermissionParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  roleId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  permissionId!: string;
}
