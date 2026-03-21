import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUserId, Public, Roles } from '../../../common/decorators';
import { AuthRateLimitGuard, JwtAuthGuard } from '../../../common/guards';
import {
  ApiAuthRequiredResponse,
  ApiRoleForbiddenResponse,
  ApiValidationFailureResponse,
} from '../../../common/swagger/api-error-responses';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { AuthService } from '../auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ListActiveSessionsQueryDto } from './dto/list-active-sessions-query.dto';
import { LogoutAllDto } from './dto/logout-all.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterSchoolDto } from './dto/register-school.dto';
import { RevokeSessionParamsDto } from './dto/revoke-session-params.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  ApiChangePasswordUnauthorized,
  ApiLoginUnauthorized,
  ApiLogoutUnauthorized,
  ApiRefreshUnauthorized,
  ApiResetPasswordUnauthorized,
} from '../../../common/swagger/auth-docs.decorators';
import { AUTH_PATHS } from '../../../common/swagger/auth-unauthorized-examples';
import { Role } from '../../../common/enums/roles.enum';

type SessionRequest = Request & {
  ip?: string;
  user?: AuthenticatedActor;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({ summary: 'Login with email or phone plus password' })
  @ApiValidationFailureResponse(AUTH_PATHS.login)
  @ApiLoginUnauthorized(AUTH_PATHS.login)
  login(@Body() dto: LoginDto, @Req() request: SessionRequest) {
    return this.authService.login(dto, this.extractSessionContext(request));
  }

  @Post('register-school')
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(AuthRateLimitGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register a school and bootstrap its initial school-admin account',
  })
  @ApiAuthRequiredResponse(AUTH_PATHS.registerSchool)
  @ApiRoleForbiddenResponse(AUTH_PATHS.registerSchool)
  @ApiValidationFailureResponse(AUTH_PATHS.registerSchool)
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
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Return the authenticated actor with current roles and permissions',
  })
  @ApiAuthRequiredResponse('/api/v1/auth/me')
  me(@CurrentUserId() actorId: string) {
    return this.authService.me(actorId);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List active refresh-token sessions for the authenticated user',
  })
  @ApiAuthRequiredResponse('/api/v1/auth/sessions')
  @ApiValidationFailureResponse('/api/v1/auth/sessions')
  sessions(
    @CurrentUserId() actorId: string,
    @Query() query: ListActiveSessionsQueryDto,
  ) {
    return this.authService.sessions(actorId, query);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Revoke a specific active session for the authenticated user',
  })
  @ApiAuthRequiredResponse('/api/v1/auth/sessions/{sessionId}')
  @ApiValidationFailureResponse('/api/v1/auth/sessions/{sessionId}')
  async revokeSession(
    @Param() params: RevokeSessionParamsDto,
    @CurrentUserId() actorId: string,
  ) {
    await this.authService.revokeSession(params.sessionId, actorId);
  }

  @Post('refresh')
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({ summary: 'Rotate refresh token and issue a new token pair' })
  @ApiValidationFailureResponse('/api/v1/auth/refresh')
  @ApiRefreshUnauthorized('/api/v1/auth/refresh')
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
  @ApiValidationFailureResponse('/api/v1/auth/forgot-password')
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() request: SessionRequest,
  ) {
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
  @ApiValidationFailureResponse('/api/v1/auth/reset-password')
  @ApiResetPasswordUnauthorized('/api/v1/auth/reset-password')
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
  @ApiAuthRequiredResponse('/api/v1/auth/logout')
  @ApiValidationFailureResponse('/api/v1/auth/logout')
  @ApiLoginUnauthorized('/api/v1/auth/logout')
  async logout(
    @Body() dto: LogoutDto,
    @CurrentUserId() actorId: string,
    @Req() request: SessionRequest,
  ) {
    await this.authService.logout(
      dto.refreshToken,
      actorId,
      this.extractSessionContext(request),
    );
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard, AuthRateLimitGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Logout and revoke all active sessions. Optionally exclude the current session.',
  })
  @ApiAuthRequiredResponse('/api/v1/auth/logout-all')
  @ApiValidationFailureResponse('/api/v1/auth/logout-all')
  @ApiLogoutUnauthorized('/api/v1/auth/logout-all')
  async logoutAll(
    @Body() dto: LogoutAllDto,
    @CurrentUserId() actorId: string,
    @Req() request: SessionRequest,
  ) {
    return this.authService.logoutAll(
      dto.refreshToken,
      dto.includeCurrent ?? false,
      actorId,
      this.extractSessionContext(request),
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Change password for the authenticated user',
  })
  @ApiAuthRequiredResponse('/api/v1/auth/change-password')
  @ApiValidationFailureResponse('/api/v1/auth/change-password')
  @ApiChangePasswordUnauthorized('/api/v1/auth/change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUserId() userId: string,
    @Req() request: SessionRequest,
  ) {
    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
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
