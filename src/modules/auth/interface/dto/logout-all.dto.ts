import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class LogoutAllDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  refreshToken!: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  includeCurrent?: boolean;
}
