import { randomUUID } from 'crypto';
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { handlePrismaError } from '../../../common/prisma/prisma-error.handler';
import { AUTH_ERROR_CODES } from '../domain/auth-errors';
import { SessionContext } from '../domain/auth.types';
import { AuthIdentityPolicy } from '../domain/policies/auth-identity.policy';
import { AuthRoleRepository } from '../infrastructure/repositories/auth-role.repository';
import { AuthSchoolRepository } from '../infrastructure/repositories/auth-school.repository';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../infrastructure/repositories/auth-user.repository';
import { AuthTokenService } from '../infrastructure/security/auth-token.service';
import { PasswordHasherService } from '../infrastructure/security/password-hasher.service';
import { TokenHasherService } from '../infrastructure/security/token-hasher.service';
import { RegisterSchoolDto } from '../interface/dto/register-school.dto';

@Injectable()
export class RegisterSchoolService {
  constructor(
    private readonly prismaTransactionService: PrismaTransactionService,
    private readonly authIdentityPolicy: AuthIdentityPolicy,
    private readonly authRoleRepository: AuthRoleRepository,
    private readonly authSchoolRepository: AuthSchoolRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly authUserRepository: AuthUserRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly tokenHasherService: TokenHasherService,
  ) {}

  async execute(dto: RegisterSchoolDto, sessionContext?: SessionContext) {
    const schoolCode = this.authIdentityPolicy.normalizeSchoolCode(
      dto.schoolCode,
    );
    const schoolAdminRole =
      await this.authRoleRepository.findByCode('SCHOOL_ADMIN');

    if (!schoolAdminRole) {
      throw new InternalServerErrorException({
        code: AUTH_ERROR_CODES.baselineRoleNotFound,
        message: 'Baseline role SCHOOL_ADMIN is not configured',
      });
    }

    const passwordHash = await this.passwordHasherService.hash(dto.password);
    const sessionId = randomUUID();

    try {
      return await this.prismaTransactionService.run(async (tx) => {
        const school = await this.authSchoolRepository.create(
          {
            name: dto.schoolName.trim(),
            code: schoolCode,
          },
          tx,
        );

        const user = await this.authUserRepository.createSchoolOwner(
          {
            schoolId: school.id,
            email: this.authIdentityPolicy.normalizeEmail(dto.email),
            phone: dto.phone?.trim() || null,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            status: UserStatus.ACTIVE,
          },
          tx,
        );

        await this.authRoleRepository.assignRoleToUser(
          user.id,
          schoolAdminRole.id,
          tx,
        );

        const authTokens = await this.authTokenService.issueTokenPair(
          user,
          sessionId,
        );

        await this.authSessionRepository.create(
          {
            id: sessionId,
            userId: user.id,
            refreshTokenHash: this.tokenHasherService.hash(
              authTokens.refreshToken,
            ),
            ipAddress: sessionContext?.ipAddress ?? null,
            userAgent: sessionContext?.userAgent ?? null,
            expiresAt: this.authTokenService.buildExpiryDate(
              authTokens.refreshExpiresIn,
            ),
          },
          tx,
        );

        return {
          ...authTokens,
          school,
          user,
          assignedRole: schoolAdminRole,
        };
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
