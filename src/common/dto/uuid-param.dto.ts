import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UuidParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}
