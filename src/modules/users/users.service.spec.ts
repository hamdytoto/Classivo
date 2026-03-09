import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { compareHash } from '../../common/security/hash.utils';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    school: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject create when email and phone are both missing', async () => {
    await expect(
      service.create({
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject create when schoolId does not exist', async () => {
    (prismaMock.school.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.create({
        schoolId: '6ef73f66-6853-4402-afd4-40e728b2cdce',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@classivo.dev',
        password: 'Password123',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should hash passwords before persisting a created user', async () => {
    (prismaMock.school.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'school-123',
    });
    (prismaMock.user.create as jest.Mock).mockImplementationOnce(({ data }) =>
      Promise.resolve({
        id: 'user-123',
        schoolId: data.schoolId,
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status ?? 'ACTIVE',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await service.create({
      schoolId: 'school-123',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@classivo.dev',
      password: 'Password123',
    });

    const createCall = (prismaMock.user.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.passwordHash).not.toBe('Password123');
    await expect(
      compareHash('Password123', createCall.data.passwordHash),
    ).resolves.toBe(true);
  });
});
