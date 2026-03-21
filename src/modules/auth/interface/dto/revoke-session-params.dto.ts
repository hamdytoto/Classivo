import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RevokeSessionParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sessionId!: string;
}
