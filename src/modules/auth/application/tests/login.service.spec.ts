import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_ACTIONS } from '../../../common/audit/audit.constants';
import { AuditLogService } from '../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../common/prisma/prisma-transaction.service';
import { AuthIdentityPolicy } from '../domain/policies/auth-identity.policy';
import { AuthSessionRepository } from '../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../infrastructure/repositories/auth-user.repository';
import { AuthTokenService } from '../infrastructure/security/auth-token.service';
import { PasswordHasherService } from '../infrastructure/security/password-hasher.service';
import { TokenHasherService } from '../infrastructure/security/token-hasher.service';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;

  const prismaTransactionServiceMock = {
    run: jest.fn(),
  };
  const authIdentityPolicyMock = {
    resolveLoginIdentifier: jest.fn(),
    assertUserIsActive: jest.fn(),
  };
  const authUserRepositoryMock = {
    findForLogin: jest.fn(),
    touchLastLoginAndGetAuthUser: jest.fn(),
  };
  const authTokenServiceMock = {
    issueTokenPair: jest.fn(),
    buildExpiryDate: jest.fn(),
  };
  const authSessionRepositoryMock = {
    create: jest.fn(),
  };
  const passwordHasherServiceMock = {
    compare: jest.fn(),
  };
  const tokenHasherServiceMock = {
    hash: jest.fn(),
  };
  const auditLogServiceMock = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: PrismaTransactionService,
          useValue: prismaTransactionServiceMock,
        },
        {
          provide: AuthIdentityPolicy,
          useValue: authIdentityPolicyMock,
        },
        {
          provide: AuthUserRepository,
          useValue: authUserRepositoryMock,
        },
        {
          provide: AuthTokenService,
          useValue: authTokenServiceMock,
        },
        {
          provide: AuthSessionRepository,
          useValue: authSessionRepositoryMock,
        },
        {
          provide: PasswordHasherService,
          useValue: passwordHasherServiceMock,
        },
        {
          provide: TokenHasherService,
          useValue: tokenHasherServiceMock,
        },
        {
          provide: AuditLogService,
          useValue: auditLogServiceMock,
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    jest.clearAllMocks();
  });

  it('should persist a session and audit a successful login', async () => {
    const tx = {};

    authIdentityPolicyMock.resolveLoginIdentifier.mockReturnValueOnce({
      email: 'user@classivo.dev',
    });
    authUserRepositoryMock.findForLogin.mockResolvedValueOnce({
      id: 'user-1',
      status: 'ACTIVE',
      passwordHash: 'stored-hash',
    });
    passwordHasherServiceMock.compare.mockResolvedValueOnce(true);
    authUserRepositoryMock.touchLastLoginAndGetAuthUser.mockResolvedValueOnce({
      id: 'user-1',
      schoolId: 'school-1',
      email: 'user@classivo.dev',
      phone: null,
      firstName: 'Test',
      lastName: 'User',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date('2026-03-21T00:00:00.000Z'),
      updatedAt: new Date('2026-03-21T00:00:00.000Z'),
    });
    authTokenServiceMock.issueTokenPair.mockResolvedValueOnce({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshToken: 'refresh-token',
      refreshExpiresIn: 604800,
    });
    authTokenServiceMock.buildExpiryDate.mockReturnValueOnce(
      new Date('2026-03-28T00:00:00.000Z'),
    );
    tokenHasherServiceMock.hash.mockReturnValueOnce('hashed-refresh-token');
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authSessionRepositoryMock.create.mockResolvedValueOnce(undefined);
    auditLogServiceMock.log.mockResolvedValueOnce(undefined);

    const result = await service.execute(
      {
        email: 'user@classivo.dev',
        password: 'Password123!',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({
          id: 'user-1',
        }),
      }),
    );

    const sessionPayload = authSessionRepositoryMock.create.mock.calls[0][0];

    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.authLogin,
        resource: 'session',
        resourceId: sessionPayload.id,
        actorId: 'user-1',
        schoolId: 'school-1',
        ipAddress: '127.0.0.1',
        metadata: expect.objectContaining({
          sessionId: sessionPayload.id,
          loginMethod: 'email',
          userAgent: 'jest',
        }),
      }),
      tx,
    );
  });

  it('should reject invalid credentials', async () => {
    authIdentityPolicyMock.resolveLoginIdentifier.mockReturnValueOnce({
      email: 'user@classivo.dev',
    });
    authUserRepositoryMock.findForLogin.mockResolvedValueOnce({
      id: 'user-1',
      status: 'ACTIVE',
      passwordHash: 'stored-hash',
    });
    passwordHasherServiceMock.compare.mockResolvedValueOnce(false);

    await expect(
      service.execute({
        email: 'user@classivo.dev',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
