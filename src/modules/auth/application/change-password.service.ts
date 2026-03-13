import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { AUTH_ERROR_CODES } from '../domain/auth-errors';
import { AuthIdentityPolicy } from '../domain/policies/auth-identity.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../infrastructure/repositories/auth-user.repository';
import { PasswordHasherService } from '../infrastructure/security/password-hasher.service';

@Injectable()
export class ChangePasswordService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly authIdentityPolicy: AuthIdentityPolicy,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly authUserRepository: AuthUserRepository,
    private readonly passwordHasherService: PasswordHasherService,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.authUserRepository.findForPasswordChange(userId);

    if (!user) {
      throw new NotFoundException({
        code: AUTH_ERROR_CODES.userNotFound,
        message: 'User not found',
      });
    }

    this.authIdentityPolicy.assertUserIsActive(user.status);

    const isCurrentPasswordValid = await this.passwordHasherService.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.invalidCurrentPassword,
        message: 'Current password is incorrect',
      });
    }

    const newPasswordHash =
      await this.passwordHasherService.hash(newPassword);

    await this.prismaTransactionService.run(async (tx) => {
      await this.authUserRepository.updatePassword(
        userId,
        newPasswordHash,
        tx,
        new Date(),
      );

      await this.authSessionRepository.revokeManyByUserId(
        userId,
        new Date(),
        undefined,
        tx,
      );
    });
  }
}
