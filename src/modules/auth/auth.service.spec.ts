import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { hash } from '../../common/security/hash.utils';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  const jwtServiceMock = {
    signAsync: jest.fn(),
  } as unknown as JwtService;

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_ACCESS_TTL = '15m';

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

  it('should reject login when password does not match', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
      status: UserStatus.ACTIVE,
      passwordHash: hash('WrongPassword123'),
    });

    await expect(
      service.login({
        email: 'john@classivo.dev',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should update last login and return user payload on successful login', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'e11785dc-d1e3-4ef2-a880-7379100d24d0',
      status: UserStatus.ACTIVE,
      passwordHash: hash('Password123'),
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
    (jwtServiceMock.signAsync as jest.Mock).mockResolvedValueOnce(
      'header.payload.signature',
    );

    const result = await service.login({
      email: 'john@classivo.dev',
      password: 'Password123',
    });

    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
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
    expect(result.accessToken).toBe('header.payload.signature');
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(900);
    expect(result).toHaveProperty('user');
    expect(result.user.email).toBe('john@classivo.dev');
  });
});
