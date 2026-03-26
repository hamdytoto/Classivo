import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { AUDIT_ACTIONS } from '../../../../common/audit/audit.constants';
import { AuditLogService } from '../../../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../../../common/prisma/prisma-transaction.service';
import { AuthIdentityPolicy } from '../../domain/policies/auth-identity.policy';
import { AuthRoleRepository } from '../../infrastructure/repositories/auth-role.repository';
import { AuthSchoolRepository } from '../../infrastructure/repositories/auth-school.repository';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../../infrastructure/repositories/auth-user.repository';
import { AuthTokenService } from '../../infrastructure/security/auth-token.service';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { TokenHasherService } from '../../infrastructure/security/token-hasher.service';
import { RegisterSchoolService } from '../register-school.service';

describe('RegisterSchoolService', () => {
  let service: RegisterSchoolService;

  const prismaTransactionServiceMock = {
    run: jest.fn(),
  };
  const authIdentityPolicyMock = {
    normalizeSchoolCode: jest.fn(),
    normalizeEmail: jest.fn(),
  };
  const authRoleRepositoryMock = {
    findByCode: jest.fn(),
    assignRoleToUser: jest.fn(),
  };
  const authSchoolRepositoryMock = {
    create: jest.fn(),
  };
  const authSessionRepositoryMock = {
    create: jest.fn(),
  };
  const authUserRepositoryMock = {
    createSchoolOwner: jest.fn(),
  };
  const authTokenServiceMock = {
    issueTokenPair: jest.fn(),
    buildExpiryDate: jest.fn(),
  };
  const passwordHasherServiceMock = {
    hash: jest.fn(),
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
        RegisterSchoolService,
        {
          provide: PrismaTransactionService,
          useValue: prismaTransactionServiceMock,
        },
        {
          provide: AuthIdentityPolicy,
          useValue: authIdentityPolicyMock,
        },
        {
          provide: AuthRoleRepository,
          useValue: authRoleRepositoryMock,
        },
        {
          provide: AuthSchoolRepository,
          useValue: authSchoolRepositoryMock,
        },
        {
          provide: AuthSessionRepository,
          useValue: authSessionRepositoryMock,
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

    service = module.get<RegisterSchoolService>(RegisterSchoolService);
    jest.clearAllMocks();
  });

  it('should audit school bootstrap completion', async () => {
    const tx = {};

    authIdentityPolicyMock.normalizeSchoolCode.mockReturnValueOnce('CLASSIVO');
    authRoleRepositoryMock.findByCode.mockResolvedValueOnce({
      id: 'role-1',
      code: 'SCHOOL_ADMIN',
      name: 'School Admin',
    });
    passwordHasherServiceMock.hash.mockResolvedValueOnce('hashed-password');
    prismaTransactionServiceMock.run.mockImplementationOnce((callback) =>
      callback(tx),
    );
    authSchoolRepositoryMock.create.mockResolvedValueOnce({
      id: 'school-1',
      name: 'Classivo Academy',
      code: 'CLASSIVO',
    });
    authIdentityPolicyMock.normalizeEmail.mockReturnValueOnce(
      'owner@classivo.dev',
    );
    authUserRepositoryMock.createSchoolOwner.mockResolvedValueOnce({
      id: 'user-1',
      schoolId: 'school-1',
      email: 'owner@classivo.dev',
      phone: null,
      firstName: 'Owner',
      lastName: 'User',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date('2026-03-21T00:00:00.000Z'),
      updatedAt: new Date('2026-03-21T00:00:00.000Z'),
    });
    authRoleRepositoryMock.assignRoleToUser.mockResolvedValueOnce(undefined);
    authTokenServiceMock.issueTokenPair.mockResolvedValueOnce({
      accessToken: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshToken: 'refresh-token',
      refreshExpiresIn: 604800,
    });
    tokenHasherServiceMock.hash.mockReturnValueOnce('hashed-refresh-token');
    authTokenServiceMock.buildExpiryDate.mockReturnValueOnce(
      new Date('2026-03-28T00:00:00.000Z'),
    );
    authSessionRepositoryMock.create.mockResolvedValueOnce(undefined);
    auditLogServiceMock.log.mockResolvedValueOnce(undefined);

    const result = await service.execute(
      {
        schoolName: 'Classivo Academy',
        schoolCode: 'classivo',
        email: 'owner@classivo.dev',
        password: 'Password123!',
        firstName: 'Owner',
        lastName: 'User',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
      'actor-1',
    );

    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        school: expect.objectContaining({
          id: 'school-1',
        }),
        user: expect.objectContaining({
          id: 'user-1',
        }),
      }),
    );

    const sessionPayload = authSessionRepositoryMock.create.mock.calls[0][0];

    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.schoolRegistered,
        resource: 'school',
        resourceId: 'school-1',
        actorId: 'actor-1',
        schoolId: 'school-1',
        ipAddress: '127.0.0.1',
        metadata: expect.objectContaining({
          schoolCode: 'CLASSIVO',
          ownerUserId: 'user-1',
          assignedRoleCode: 'SCHOOL_ADMIN',
          sessionId: sessionPayload.id,
          userAgent: 'jest',
        }),
      }),
      tx,
    );
  });

  it('should reject registration when the baseline school-admin role is missing', async () => {
    authIdentityPolicyMock.normalizeSchoolCode.mockReturnValueOnce('CLASSIVO');
    authRoleRepositoryMock.findByCode.mockResolvedValueOnce(null);

    await expect(
      service.execute({
        schoolName: 'Classivo Academy',
        schoolCode: 'classivo',
        email: 'owner@classivo.dev',
        password: 'Password123!',
        firstName: 'Owner',
        lastName: 'User',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(passwordHasherServiceMock.hash).not.toHaveBeenCalled();
    expect(prismaTransactionServiceMock.run).not.toHaveBeenCalled();
  });
});
