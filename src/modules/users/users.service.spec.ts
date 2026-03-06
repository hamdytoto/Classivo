import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
});
