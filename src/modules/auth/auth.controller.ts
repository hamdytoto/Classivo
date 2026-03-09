import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';

type SessionRequest = Request & {
  ip?: string;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  @Public()
  @ApiOperation({ summary: 'Auth module status endpoint' })
  getStatus(): string {
    return this.authService.getStatus();
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login with email or phone plus password' })
  login(@Body() dto: LoginDto, @Req() request: SessionRequest) {
    return this.authService.login(dto, this.extractSessionContext(request));
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Rotate refresh token and issue a new token pair' })
  refresh(@Body() dto: RefreshTokenDto, @Req() request: SessionRequest) {
    return this.authService.refresh(
      dto.refreshToken,
      this.extractSessionContext(request),
    );
  }

  private extractSessionContext(request: SessionRequest) {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.get?.('user-agent') ?? null,
    };
  }
}
