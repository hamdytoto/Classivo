import { Injectable } from '@nestjs/common';
import { ChangePasswordService } from './application/change-password.service';
import { ConfirmPasswordResetService } from './application/confirm-password-reset.service';
import { GetCurrentUserProfileService } from './application/get-current-user-profile.service';
import { ListActiveSessionsService } from './application/list-active-sessions.service';
import { LoginService } from './application/login.service';
import { LogoutAllService } from './application/logout-all.service';
import { LogoutService } from './application/logout.service';
import { RefreshSessionService } from './application/refresh-session.service';
import { RegisterSchoolService } from './application/register-school.service';
import { RequestPasswordResetService } from './application/request-password-reset.service';
import { RevokeSessionService } from './application/revoke-session.service';
import { SessionContext } from './domain/auth.types';
import { LoginDto } from './interface/dto/login.dto';
import { RegisterSchoolDto } from './interface/dto/register-school.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginService: LoginService,
    private readonly refreshSessionService: RefreshSessionService,
    private readonly logoutService: LogoutService,
    private readonly logoutAllService: LogoutAllService,
    private readonly revokeSessionService: RevokeSessionService,
    private readonly registerSchoolService: RegisterSchoolService,
    private readonly changePasswordService: ChangePasswordService,
    private readonly requestPasswordResetService: RequestPasswordResetService,
    private readonly confirmPasswordResetService: ConfirmPasswordResetService,
    private readonly getCurrentUserProfileService: GetCurrentUserProfileService,
    private readonly listActiveSessionsService: ListActiveSessionsService,
  ) {}

  login(dto: LoginDto, sessionContext?: SessionContext) {
    return this.loginService.execute(dto, sessionContext);
  }

  refresh(refreshToken: string, sessionContext?: SessionContext) {
    return this.refreshSessionService.execute(refreshToken, sessionContext);
  }

  logout(refreshToken: string, actorId?: string) {
    return this.logoutService.execute(refreshToken, actorId);
  }

  logoutAll(refreshToken: string, includeCurrent: boolean, actorId?: string) {
    return this.logoutAllService.execute(refreshToken, includeCurrent, actorId);
  }

  revokeSession(sessionId: string, actorId: string) {
    return this.revokeSessionService.execute(sessionId, actorId);
  }

  registerSchool(dto: RegisterSchoolDto, sessionContext?: SessionContext) {
    return this.registerSchoolService.execute(dto, sessionContext);
  }

  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.changePasswordService.execute(
      userId,
      currentPassword,
      newPassword,
    );
  }

  forgotPassword(email: string, sessionContext?: SessionContext) {
    return this.requestPasswordResetService.execute(email, sessionContext);
  }

  resetPassword(email: string, otp: string, newPassword: string) {
    return this.confirmPasswordResetService.execute(email, otp, newPassword);
  }

  me(actorId: string) {
    return this.getCurrentUserProfileService.execute(actorId);
  }

  sessions(actorId: string) {
    return this.listActiveSessionsService.execute(actorId);
  }
}
