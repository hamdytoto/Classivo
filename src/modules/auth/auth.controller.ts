import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators';
import { AuthRateLimitGuard, JwtAuthGuard } from '../../common/guards';
import type { AuthenticatedActor } from '../../common/types/request-context.type';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { LogoutAllDto } from './dto/logout-all.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { CurrentUserId } from '../../common/decorators';

type SessionRequest = Request & {
  ip?: string;
  user?: AuthenticatedActor;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({ summary: 'Login with email or phone plus password' })
  login(@Body() dto: LoginDto, @Req() request: SessionRequest) {
    return this.authService.login(dto, this.extractSessionContext(request));
  }

  @Post('register-school')
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({
    summary: 'Register a school and bootstrap its initial school-admin account',
  })
  registerSchool(
    @Body() dto: RegisterSchoolDto,
    @Req() request: SessionRequest,
  ) {
    return this.authService.registerSchool(
      dto,
      this.extractSessionContext(request),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Return the authenticated actor with current roles and permissions',
  })
  me(@CurrentUserId() actorId: string) {
    return this.authService.me(actorId);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List active refresh-token sessions for the authenticated user',
  })
  sessions(@CurrentUserId() actorId: string) {
    return this.authService.sessions(actorId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Revoke a specific active session for the authenticated user',
  })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUserId() actorId: string,
  ) {
    await this.authService.revokeSession(sessionId, actorId);
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

  @Post('forgot-password')
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request a password reset OTP to be sent to the user email',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: SessionRequest) {
    return this.authService.forgotPassword(
      dto.email,
      this.extractSessionContext(request),
    );
  }

  @Post('reset-password')
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Reset password using email and OTP verification',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, AuthRateLimitGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Logout and revoke the active refresh-token session',
  })
  async logout(@Body() dto: LogoutDto, @CurrentUserId() actorId: string) {
    await this.authService.logout(dto.refreshToken, actorId);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard, AuthRateLimitGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Logout and revoke all active sessions. Optionally exclude the current session.',
  })
  async logoutAll(@Body() dto: LogoutAllDto, @CurrentUserId() actorId: string) {
    return this.authService.logoutAll(
      dto.refreshToken,
      dto.includeCurrent ?? false,
      actorId,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Change password for the authenticated user',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUserId() userId: string,
  ) {
    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  private extractSessionContext(request: SessionRequest) {
    return {
      ipAddress: request.ip ?? null,
      userAgent: request.get?.('user-agent') ?? null,
    };
  }
}
