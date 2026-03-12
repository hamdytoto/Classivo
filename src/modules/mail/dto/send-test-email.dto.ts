import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendTestEmailDto {
  @ApiProperty({
    example: 'student@example.com',
    description: 'Recipient email address',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    example: 'Classivo mail test',
    description: 'Email subject',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    example: '<h1>Mail test</h1><p>This was sent from Swagger UI.</p>',
    description: 'HTML email body',
  })
  @IsString()
  html: string;

  @ApiPropertyOptional({
    example: 'Mail test - This was sent from Swagger UI.',
    description: 'Plain text fallback content',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    example: 'Classivo Test User',
    description: 'Recipient display name',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
