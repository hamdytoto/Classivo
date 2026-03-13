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

  it('should return assigned roles for an existing user', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-123',
      roles: [
        {
          assignedAt: new Date('2026-03-13T00:00:00.000Z'),
          role: {
            id: 'role-1',
            code: 'SCHOOL_ADMIN',
            name: 'School Admin',
          },
        },
        {
          assignedAt: new Date('2026-03-12T00:00:00.000Z'),
          role: {
            id: 'role-2',
            code: 'TEACHER',
            name: 'Teacher',
          },
        },
      ],
    });

    await expect(service.findRoles('user-123')).resolves.toEqual({
      userId: 'user-123',
      roles: [
        {
          id: 'role-1',
          code: 'SCHOOL_ADMIN',
          name: 'School Admin',
          assignedAt: new Date('2026-03-13T00:00:00.000Z'),
        },
        {
          id: 'role-2',
          code: 'TEACHER',
          name: 'Teacher',
          assignedAt: new Date('2026-03-12T00:00:00.000Z'),
        },
      ],
    });
  });

  it('should reject role inspection when the user does not exist', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(service.findRoles('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should return effective permissions grouped by granting roles', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-123',
      roles: [
        {
          role: {
            id: 'role-1',
            code: 'SCHOOL_ADMIN',
            name: 'School Admin',
            permissions: [
              {
                permission: {
                  id: 'permission-1',
                  code: 'users.read',
                  name: 'Read Users',
                },
              },
              {
                permission: {
                  id: 'permission-2',
                  code: 'users.write',
                  name: 'Write Users',
                },
              },
            ],
          },
        },
        {
          role: {
            id: 'role-2',
            code: 'SUPPORT',
            name: 'Support',
            permissions: [
              {
                permission: {
                  id: 'permission-1',
                  code: 'users.read',
                  name: 'Read Users',
                },
              },
            ],
          },
        },
      ],
    });

    await expect(service.findPermissions('user-123')).resolves.toEqual({
      userId: 'user-123',
      permissions: [
        {
          id: 'permission-1',
          code: 'users.read',
          name: 'Read Users',
          grantedByRoles: [
            {
              id: 'role-1',
              code: 'SCHOOL_ADMIN',
              name: 'School Admin',
            },
            {
              id: 'role-2',
              code: 'SUPPORT',
              name: 'Support',
            },
          ],
        },
        {
          id: 'permission-2',
          code: 'users.write',
          name: 'Write Users',
          grantedByRoles: [
            {
              id: 'role-1',
              code: 'SCHOOL_ADMIN',
              name: 'School Admin',
            },
          ],
        },
      ],
    });
  });

  it('should reject permission inspection when the user does not exist', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.findPermissions('missing-user'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
