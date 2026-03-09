import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { hash } from '../../common/security/hash.utils';
import { hashToken } from '../../common/security/jwt.utils';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
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
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.login({
        email: 'missing@classivo.dev',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should issue access and refresh tokens on successful login', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
      status: UserStatus.ACTIVE,
      passwordHash: await hash('Password123'),
    });

    (prismaMock.user.update as jest.Mock).mockResolvedValueOnce({
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

    (jwtServiceMock.signAsync as jest.Mock)
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

    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
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
        jwtid: expect.any(String),
      }),
    );
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      2,
      {
        sub: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
        sid: expect.any(String),
        type: 'refresh',
      },
      expect.objectContaining({
        secret: 'test-refresh-secret',
        expiresIn: 604800,
        jwtid: expect.any(String),
      }),
    );
    expect(prismaMock.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
        refreshTokenHash: hashToken('refresh-token'),
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
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

  it('should rotate refresh token and update the session', async () => {
    (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    (prismaMock.session.findUnique as jest.Mock).mockResolvedValueOnce({
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

    (jwtServiceMock.signAsync as jest.Mock)
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await service.refresh('current-refresh-token', {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith(
      'current-refresh-token',
      {
        secret: 'test-refresh-secret',
      },
    );
    expect(prismaMock.session.update).toHaveBeenCalledWith({
      where: { id: 'session-123' },
      data: expect.objectContaining({
        refreshTokenHash: hashToken('new-refresh-token'),
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      }),
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
    (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    (prismaMock.session.findUnique as jest.Mock).mockResolvedValueOnce({
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

    await expect(service.refresh('replayed-refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prismaMock.session.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it('should revoke the targeted session on logout', async () => {
    (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    (prismaMock.session.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'session-123',
      userId: 'user-123',
      refreshTokenHash: hashToken('refresh-token'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    await expect(service.logout('refresh-token', 'user-123')).resolves.toBeUndefined();

    expect(prismaMock.session.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-123',
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });

  it('should reject logout when access token subject does not own the session', async () => {
    (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    await expect(service.logout('refresh-token', 'user-456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prismaMock.session.findUnique).not.toHaveBeenCalled();
  });

  it('should reject refresh for a revoked session after logout', async () => {
    (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValueOnce({
      sub: 'user-123',
      sid: 'session-123',
      type: 'refresh',
    });

    (prismaMock.session.findUnique as jest.Mock).mockResolvedValueOnce({
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
});
