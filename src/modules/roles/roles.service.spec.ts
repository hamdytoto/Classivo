import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;

  const prismaMock = {
    role: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    permission: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rolePermission: {
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    userRole: {
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw not found when role does not exist', async () => {
    (prismaMock.role.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.findOneRole('1dd163f2-becf-4409-b115-708f656ef813'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should pass through conflict exception for duplicate role code', async () => {
    (prismaMock.role.create as jest.Mock).mockRejectedValueOnce(
      new ConflictException(),
    );

    await expect(
      service.createRole({
        code: 'SCHOOL_ADMIN',
        name: 'School Admin',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

