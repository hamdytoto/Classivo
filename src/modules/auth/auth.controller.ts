import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators';
import { AuthRateLimitGuard, JwtAuthGuard } from '../../common/guards';
import type { AuthenticatedActor } from '../../common/types/request-context.type';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';

type SessionRequest = Request & {
  ip?: string;
  user?: AuthenticatedActor;
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
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({ summary: 'Login with email or phone plus password' })
  login(@Body() dto: LoginDto, @Req() request: SessionRequest) {
    return this.authService.login(dto, this.extractSessionContext(request));
  }

  @Post('refresh')
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new token pair' })
  refresh(@Body() dto: RefreshTokenDto, @Req() request: SessionRequest) {
    return this.authService.refresh(
      dto.refreshToken,
      this.extractSessionContext(request),
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, AuthRateLimitGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Logout and revoke the active refresh-token session' })
  async logout(@Body() dto: LogoutDto, @Req() request: SessionRequest) {
    const actor = request.user;
    const actorId = actor?.id ?? actor?.userId ?? actor?.sub;

    if (!actorId) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message:
          'Authenticated user is required. Provide a valid access token.',
      });
    }

    await this.authService.logout(dto.refreshToken, actorId);
  }

  private extractSessionContext(request: SessionRequest) {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.get?.('user-agent') ?? null,
    };
  }
}
