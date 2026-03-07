import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
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
  @ApiOperation({ summary: 'Login with email or phone plus password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
