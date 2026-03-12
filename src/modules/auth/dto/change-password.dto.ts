import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        example: 'OldPassword123',
        description: 'The current password for verification',
    })
    @IsString()
    @IsNotEmpty()
    currentPassword!: string;

    @ApiProperty({
        example: 'NewPassword456',
        description: 'The new password (must be at least 8 characters)',
    })
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    @MinLength(8, {
        message: 'New password must be at least 8 characters long',
    })
    newPassword!: string;
}
