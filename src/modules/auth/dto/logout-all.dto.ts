import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class LogoutAllDto {
    @ApiProperty({
        example: 'refresh-token-string',
        description:
            'The current refresh token. Required when includeCurrent is false to identify the current session to preserve.',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken!: string;

    @ApiProperty({
        example: false,
        description:
            'If true, revoke all sessions including the current one. If false, preserve the current session and revoke all others.',
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    includeCurrent: boolean = false;
}
