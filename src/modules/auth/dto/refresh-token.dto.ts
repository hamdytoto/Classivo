import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({ example: 'refresh-token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
