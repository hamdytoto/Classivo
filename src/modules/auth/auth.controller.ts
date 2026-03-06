import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  @ApiOperation({ summary: 'Auth module status endpoint' })
  getStatus(): string {
    return this.authService.getStatus();
  }

  @Post('login')
  @ApiOperation({ summary: 'Auth module login endpoint' })
  login(@Body() body: string): string {
    return this.authService.login(body);
  }
}
