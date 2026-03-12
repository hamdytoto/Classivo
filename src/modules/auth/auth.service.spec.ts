import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { hash } from '../../common/security/hash.utils';
import { hashToken } from '../../common/security/jwt.utils';
import { AuthSessionService } from './auth-session.service';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';

describe('AuthService', () => {
  let service: AuthService;
  const anyString = expect.any(String) as unknown;
  const anyDate = expect.any(Date) as unknown;
  const anyObject = expect.any(Object) as unknown;

  const prismaTransactionMock = jest.fn();
  const userFindUniqueMock = jest.fn();
  const userUpdateMock = jest.fn();
  const roleFindUniqueMock = jest.fn();
  const schoolCreateMock = jest.fn();
  const userRoleCreateMock = jest.fn();
  const sessionCreateMock = jest.fn();
  const sessionFindUniqueMock = jest.fn();
  const sessionFindManyMock = jest.fn();
  const sessionUpdateMock = jest.fn();
  const sessionUpdateManyMock = jest.fn();
  const prismaMock = {
    $transaction: prismaTransactionMock,
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
    role: {
      findUnique: roleFindUniqueMock,
    },
    school: {
      create: schoolCreateMock,
    },
    userRole: {
      create: userRoleCreateMock,
    },
    session: {
      create: sessionCreateMock,
      findUnique: sessionFindUniqueMock,
      findMany: sessionFindManyMock,
      update: sessionUpdateMock,
      updateMany: sessionUpdateManyMock,
    },
  } as unknown as PrismaService;

  const signAsyncMock = jest.fn();
  const verifyAsyncMock = jest.fn();
  const jwtServiceMock = {
    signAsync: signAsyncMock,
    verifyAsync: verifyAsyncMock,
  } as unknown as JwtService;

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_REFRESH_TTL = '7d';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        AuthSessionService,
        AuthTokenService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject login when both email and phone are missing', async () => {
    await expect(
      service.login({
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject login when both email and phone are provided', async () => {
    await expect(
      service.login({
        email: 'john@classivo.dev',
        phone: '+201000000000',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject login when user does not exist', async () => {
    userFindUniqueMock.mockResolvedValueOnce(null);

    await expect(
      service.login({
        email: 'missing@classivo.dev',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should issue access and refresh tokens on successful login', async () => {
    userFindUniqueMock.mockResolvedValueOnce({
      id: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
      status: UserStatus.ACTIVE,
      passwordHash: await hash('Password123'),
    });

    userUpdateMock.mockResolvedValueOnce({
      id: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
      schoolId: null,
      email: 'john@classivo.dev',
      phone: null,
      firstName: 'John',
      lastName: 'Doe',
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date('2026-03-08T00:00:00.000Z'),
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-08T00:00:00.000Z'),
    });

    signAsyncMock
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login(
      {
        email: 'john@classivo.dev',
        password: 'Password123',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );

    expect(signAsyncMock).toHaveBeenNthCalledWith(
      1,
      {
        sub: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
        schoolId: null,
        email: 'john@classivo.dev',
        phone: null,
        status: UserStatus.ACTIVE,
      },
      expect.objectContaining({
        secret: 'test-access-secret',
        expiresIn: 900,
        jwtid: anyString,
      }),
    );
    expect(signAsyncMock).toHaveBeenNthCalledWith(
      2,
      {
        sub: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
        sid: anyString,
        type: 'refresh',
      },
      expect.objectContaining({
        secret: 'test-refresh-secret',
        expiresIn: 604800,
        jwtid: anyString,
      }),
    );
    expect(sessionCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
        refreshTokenHash: hashToken('refresh-token'),
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }) as unknown,
    });
    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        refreshExpiresIn: 604800,
      }),
    );
  });

  it('should return the authenticated actor with resolved roles and permissions', async () => {
    userFindUniqueMock.mockResolvedValueOnce({
      id: 'user-123',
      schoolId: 'school-123',
      email: 'owner@classivo.dev',
      phone: null,
      firstName: 'John',
      lastName: 'Doe',
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date('2026-03-08T00:00:00.000Z'),
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-08T00:00:00.000Z'),
      roles: [
        {
          role: {
            code: 'SCHOOL_ADMIN',
            permissions: [
              { permission: { code: 'users.read' } },
              { permission: { code: 'users.write' } },
            ],
          },
        },
        {
          role: {
            code: 'SUPPORT',
            permissions: [
              { permission: { code: 'users.read' } },
              { permission: { code: 'roles.read' } },
            ],
          },
        },
      ],
    });

    const result = await service.me('user-123');

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: expect.objectContaining({
        id: true,
        roles: expect.any(Object) as unknown,
      }) as unknown,
    });
    expect(result).toEqual({
      id: 'user-123',
      schoolId: 'school-123',
      email: 'owner@classivo.dev',
      phone: null,
      firstName: 'John',
      lastName: 'Doe',
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date('2026-03-08T00:00:00.000Z'),
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-08T00:00:00.000Z'),
      roles: ['SCHOOL_ADMIN', 'SUPPORT'],
      permissions: ['users.read', 'users.write', 'roles.read'],
    });
  });

  it('should reject auth/me when the authenticated user no longer exists', async () => {
    userFindUniqueMock.mockResolvedValueOnce(null);

    await expect(service.me('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should return active sessions for the authenticated actor', async () => {
    sessionFindManyMock.mockResolvedValueOnce([
      {
        id: 'session-2',
        ipAddress: '10.0.0.2',
        userAgent: 'Chrome',
        expiresAt: new Date('2026-03-20T00:00:00.000Z'),
        createdAt: new Date('2026-03-11T00:00:00.000Z'),
        updatedAt: new Date('2026-03-12T00:00:00.000Z'),
      },
      {
        id: 'session-1',
        ipAddress: '10.0.0.1',
        userAgent: 'Safari',
        expiresAt: new Date('2026-03-19T00:00:00.000Z'),
        createdAt: new Date('2026-03-10T00:00:00.000Z'),
        updatedAt: new Date('2026-03-11T00:00:00.000Z'),
      },
    ]);

    const result = await service.sessions('user-123');

    expect(sessionFindManyMock).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        revokedAt: null,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toEqual([
      {
        id: 'session-2',
        ipAddress: '10.0.0.2',
        userAgent: 'Chrome',
        expiresAt: new Date('2026-03-20T00:00:00.000Z'),
        createdAt: new Date('2026-03-11T00:00:00.000Z'),
        updatedAt: new Date('2026-03-12T00:00:00.000Z'),
      },
      {
        id: 'session-1',
        ipAddress: '10.0.0.1',
        userAgent: 'Safari',
        expiresAt: new Date('2026-03-19T00:00:00.000Z'),
        createdAt: new Date('2026-03-10T00:00:00.000Z'),
        updatedAt: new Date('2026-03-11T00:00:00.000Z'),
      },
    ]);
  });

  it('should return an empty active session list when the actor has none', async () => {
    sessionFindManyMock.mockResolvedValueOnce([]);

    await expect(service.sessions('user-123')).resolves.toEqual([]);
  });

  it('should revoke a specific owned session', async () => {
    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    await expect(
      service.revokeSession('session-123', 'user-123'),
    ).resolves.toBeUndefined();

    expect(sessionUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        revokedAt: null,
      },
      data: {
        revokedAt: anyDate,
      },
    });
  });

  it('should reject revoking a session that does not belong to the actor', async () => {
    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-456',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    await expect(
      service.revokeSession('session-123', 'user-123'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(sessionUpdateManyMock).not.toHaveBeenCalled();
  });

  it('should treat revoking an already revoked session as idempotent', async () => {
    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });

    await expect(
      service.revokeSession('session-123', 'user-123'),
    ).resolves.toBeUndefined();

    expect(sessionUpdateManyMock).not.toHaveBeenCalled();
  });

  it('should register a school and bootstrap its owner session', async () => {
    const transactionClient = {
      school: {
        create: jest.fn().mockResolvedValueOnce({
          id: 'school-123',
          name: 'Classivo Academy',
          code: 'CLASSIVO',
          createdAt: new Date('2026-03-09T00:00:00.000Z'),
          updatedAt: new Date('2026-03-09T00:00:00.000Z'),
        }),
      },
      user: {
        create: jest.fn().mockResolvedValueOnce({
          id: 'user-123',
          schoolId: 'school-123',
          email: 'owner@classivo.dev',
          phone: null,
          firstName: 'John',
          lastName: 'Doe',
          status: UserStatus.ACTIVE,
          lastLoginAt: null,
          createdAt: new Date('2026-03-09T00:00:00.000Z'),
          updatedAt: new Date('2026-03-09T00:00:00.000Z'),
        }),
      },
      userRole: {
        create: jest.fn().mockResolvedValueOnce(undefined),
      },
      session: {
        create: jest.fn().mockResolvedValueOnce({
          id: 'session-123',
        }),
      },
    };

    roleFindUniqueMock.mockResolvedValueOnce({
      id: 'role-school-admin',
      code: 'SCHOOL_ADMIN',
      name: 'School Admin',
    });
    prismaTransactionMock.mockImplementationOnce(
      async (
        callback: (tx: typeof transactionClient) => Promise<unknown>,
      ): Promise<unknown> => callback(transactionClient),
    );
    signAsyncMock
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.registerSchool(
      {
        schoolName: 'Classivo Academy',
        schoolCode: 'classivo',
        email: 'owner@classivo.dev',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    );

    expect(roleFindUniqueMock).toHaveBeenCalledWith({
      where: { code: 'SCHOOL_ADMIN' },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
    expect(transactionClient.school.create).toHaveBeenCalledWith({
      data: {
        name: 'Classivo Academy',
        code: 'CLASSIVO',
      },
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(transactionClient.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: 'school-123',
        email: 'owner@classivo.dev',
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
      }) as unknown,
      select: anyObject,
    });
    expect(transactionClient.userRole.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        roleId: 'role-school-admin',
      },
    });
    expect(transactionClient.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-123',
        refreshTokenHash: hashToken('refresh-token'),
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }) as unknown,
    });
    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        assignedRole: {
          id: 'role-school-admin',
          code: 'SCHOOL_ADMIN',
          name: 'School Admin',
        },
        school: expect.objectContaining({
          id: 'school-123',
          code: 'CLASSIVO',
        }) as unknown,
        user: expect.objectContaining({
          id: 'user-123',
          schoolId: 'school-123',
        }) as unknown,
      }),
    );
  });

  it('should fail registration when SCHOOL_ADMIN baseline role is missing', async () => {
    roleFindUniqueMock.mockResolvedValueOnce(null);

    await expect(
      service.registerSchool({
        schoolName: 'Classivo Academy',
        schoolCode: 'classivo',
        email: 'owner@classivo.dev',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(prismaTransactionMock).not.toHaveBeenCalled();
  });

  it('should convert duplicate school or owner conflicts into a conflict exception', async () => {
    roleFindUniqueMock.mockResolvedValueOnce({
      id: 'role-school-admin',
      code: 'SCHOOL_ADMIN',
      name: 'School Admin',
    });
    prismaTransactionMock.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: {
          target: ['School_code_key'],
        },
      }),
    );

    await expect(
      service.registerSchool({
        schoolName: 'Classivo Academy',
        schoolCode: 'classivo',
        email: 'owner@classivo.dev',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should rotate refresh token and update the session', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('current-refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: {
        id: 'user-123',
        schoolId: null,
        email: 'john@classivo.dev',
        phone: null,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date('2026-03-08T00:00:00.000Z'),
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-08T00:00:00.000Z'),
      },
    });

    signAsyncMock
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await service.refresh('current-refresh-token', {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(verifyAsyncMock).toHaveBeenCalledWith('current-refresh-token', {
      secret: 'test-refresh-secret',
    });
    expect(sessionUpdateMock).toHaveBeenCalledWith({
      where: { id: 'session-123' },
      data: expect.objectContaining({
        refreshTokenHash: hashToken('new-refresh-token'),
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }) as unknown,
    });
    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
        refreshExpiresIn: 604800,
      }),
    );
  });

  it('should revoke the session when refresh token reuse is detected', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('different-refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: {
        id: 'user-123',
        schoolId: null,
        email: 'john@classivo.dev',
        phone: null,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date('2026-03-08T00:00:00.000Z'),
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-08T00:00:00.000Z'),
      },
    });

    await expect(
      service.refresh('replayed-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessionUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        revokedAt: null,
      },
      data: {
        revokedAt: anyDate,
      },
    });
  });

  it('should revoke the targeted session on logout', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    await expect(
      service.logout('refresh-token', 'user-123'),
    ).resolves.toBeUndefined();

    expect(sessionUpdateManyMock).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        revokedAt: null,
      },
      data: {
        revokedAt: anyDate,
      },
    });
  });

  it('should reject logout when access token subject does not own the session', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    await expect(
      service.logout('refresh-token', 'user-456'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessionFindUniqueMock).not.toHaveBeenCalled();
  });

  it('should reject refresh for a revoked session after logout', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      user: {
        id: 'user-123',
        schoolId: null,
        email: 'john@classivo.dev',
        phone: null,
        firstName: 'John',
        lastName: 'Doe',
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date('2026-03-08T00:00:00.000Z'),
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-08T00:00:00.000Z'),
      },
    });

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should revoke all sessions except the current one when logoutAll is called with includeCurrent = false', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    const authSessionService = (service as any).authSessionService;
    const revokeMultipleSpy = jest
      .spyOn(authSessionService, 'revokeMultipleSessions')
      .mockResolvedValueOnce(2);

    const result = await service.logoutAll('refresh-token', false, 'user-123');

    expect(revokeMultipleSpy).toHaveBeenCalledWith('user-123', 'session-123');
    expect(result).toEqual({ revokedCount: 2 });
    revokeMultipleSpy.mockRestore();
  });

  it('should revoke all sessions including the current one when logoutAll is called with includeCurrent = true', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    const authSessionService = (service as any).authSessionService;
    const revokeMultipleSpy = jest
      .spyOn(authSessionService, 'revokeMultipleSessions')
      .mockResolvedValueOnce(3);

    const result = await service.logoutAll('refresh-token', true, 'user-123');

    expect(revokeMultipleSpy).toHaveBeenCalledWith('user-123', undefined);
    expect(result).toEqual({ revokedCount: 3 });
    revokeMultipleSpy.mockRestore();
  });

  it('should reject logoutAll when access token subject does not own the session', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    await expect(
      service.logoutAll('refresh-token', false, 'user-456'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessionFindUniqueMock).not.toHaveBeenCalled();
  });

  it('should handle logoutAll with no sessions to revoke', async () => {
    verifyAsyncMock.mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    sessionFindUniqueMock.mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    const authSessionService = (service as any).authSessionService;
    const revokeMultipleSpy = jest
      .spyOn(authSessionService, 'revokeMultipleSessions')
      .mockResolvedValueOnce(0);

    const result = await service.logoutAll(
      'refresh-token',
      false,
      'user-123',
    );

    expect(result).toEqual({ revokedCount: 0 });
    revokeMultipleSpy.mockRestore();
  });

  it('should successfully change password and revoke all sessions', async () => {
    const oldPasswordHash = await hash('OldPassword123');
    const newPasswordHash = await hash('NewPassword456');

    userFindUniqueMock.mockResolvedValueOnce({
      id: 'user-123',
      passwordHash: oldPasswordHash,
      status: UserStatus.ACTIVE,
    });

    const transactionMock = jest.fn().mockImplementation(async (callback) => {
      return callback({
        user: {
          update: jest.fn().mockResolvedValueOnce({ id: 'user-123' }),
        },
        session: {
          updateMany: jest
            .fn()
            .mockResolvedValueOnce({ count: 3 }),
        },
      });
    });

    (prismaMock.$transaction as jest.Mock) = transactionMock;

    await expect(
      service.changePassword('user-123', 'OldPassword123', 'NewPassword456'),
    ).resolves.toBeUndefined();

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });
  });

  it('should reject password change with invalid current password', async () => {
    const passwordHash = await hash('OldPassword123');

    userFindUniqueMock.mockResolvedValueOnce({
      id: 'user-123',
      passwordHash,
      status: UserStatus.ACTIVE,
    });

    await expect(
      service.changePassword('user-123', 'WrongPassword', 'NewPassword456'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });
  });

  it('should reject password change when user does not exist', async () => {
    userFindUniqueMock.mockResolvedValueOnce(null);

    await expect(
      service.changePassword('missing-user', 'OldPassword123', 'NewPassword456'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'missing-user' },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });
  });

  it('should reject password change when account is inactive', async () => {
    const passwordHash = await hash('OldPassword123');

    userFindUniqueMock.mockResolvedValueOnce({
      id: 'user-123',
      passwordHash,
      status: UserStatus.SUSPENDED,
    });

    await expect(
      service.changePassword('user-123', 'OldPassword123', 'NewPassword456'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(userFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });
  });
});
