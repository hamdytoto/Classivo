import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '../../common/dto/pagination-query.dto';
import { compareHash } from '../../common/security/hash.utils';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserService } from './application/create-user.service';
import { FindUserPermissionsService } from './application/find-user-permissions.service';
import { FindUserRolesService } from './application/find-user-roles.service';
import { FindUserService } from './application/find-user.service';
import { FindUsersService } from './application/find-users.service';
import { GetCurrentUserProfileService } from './application/get-current-user-profile.service';
import { UpdateUserService } from './application/update-user.service';
import { UsersAccessPolicy } from './domain/policies/users-access.policy';
import { UsersRepository } from './infrastructure/repositories/users.repository';
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
        CreateUserService,
        FindUsersService,
        FindUserService,
        UpdateUserService,
        GetCurrentUserProfileService,
        FindUserRolesService,
        FindUserPermissionsService,
        UsersAccessPolicy,
        UsersRepository,
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

  it('should scope created users to the actor school for non-super-admin actors', async () => {
    (prismaMock.school.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'school-actor',
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

    await service.create(
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@classivo.dev',
        password: 'Password123',
      },
      {
        id: 'actor-1',
        schoolId: 'school-actor',
        roles: ['SCHOOL_ADMIN'],
      },
    );

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: 'school-actor',
        }),
      }),
    );
  });

  it('should reject create when a scoped actor targets another school', async () => {
    await expect(
      service.create(
        {
          schoolId: 'school-other',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@classivo.dev',
          password: 'Password123',
        },
        {
          id: 'actor-1',
          schoolId: 'school-actor',
          roles: ['SCHOOL_ADMIN'],
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
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
      data: [
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
      meta: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('should reject role inspection when the user does not exist', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(service.findRoles('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should hide user-role inspection for other schools from scoped actors', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-123',
      schoolId: 'school-other',
      roles: [],
    });

    await expect(
      service.findRoles(
        'user-123',
        {},
        {
          id: 'actor-1',
          schoolId: 'school-1',
          roles: ['SCHOOL_ADMIN'],
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
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
      data: [
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
      meta: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('should paginate and sort users with shared list metadata', async () => {
    (prismaMock.user.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'user-1',
        schoolId: 'school-1',
        email: 'admin@classivo.dev',
        phone: null,
        firstName: 'Admin',
        lastName: 'User',
        status: 'ACTIVE',
        lastLoginAt: null,
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        updatedAt: new Date('2026-03-13T00:00:00.000Z'),
      },
    ]);
    (prismaMock.user.count as jest.Mock).mockResolvedValueOnce(1);
    (prismaMock.$transaction as jest.Mock).mockImplementationOnce((operations) =>
      Promise.all(operations),
    );

    await expect(
      service.findAll({
        page: 2,
        limit: 5,
        email: 'classivo.dev',
        sortBy: 'email',
        sortOrder: SortOrder.asc,
      }),
    ).resolves.toEqual({
      data: [
        {
          id: 'user-1',
          schoolId: 'school-1',
          email: 'admin@classivo.dev',
          phone: null,
          firstName: 'Admin',
          lastName: 'User',
          status: 'ACTIVE',
          lastLoginAt: null,
          createdAt: new Date('2026-03-13T00:00:00.000Z'),
          updatedAt: new Date('2026-03-13T00:00:00.000Z'),
        },
      ],
      meta: {
        page: 2,
        limit: 5,
        total: 1,
        totalPages: 1,
      },
    });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        orderBy: { email: 'asc' },
        where: {
          email: {
            contains: 'classivo.dev',
            mode: 'insensitive',
          },
        },
      }),
    );
  });

  it('should scope user listings to the actor school', async () => {
    (prismaMock.user.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prismaMock.user.count as jest.Mock).mockResolvedValueOnce(0);
    (prismaMock.$transaction as jest.Mock).mockImplementationOnce((operations) =>
      Promise.all(operations),
    );

    await service.findAll(
      {
        page: 1,
        limit: 10,
      },
      {
        id: 'actor-1',
        schoolId: 'school-1',
        roles: ['SCHOOL_ADMIN'],
      },
    );

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId: 'school-1',
        },
      }),
    );
  });

  it('should reject permission inspection when the user does not exist', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.findPermissions('missing-user'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should hide user-permission inspection for other schools from scoped actors', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-123',
      schoolId: 'school-other',
      roles: [],
    });

    await expect(
      service.findPermissions(
        'user-123',
        {},
        {
          id: 'actor-1',
          schoolId: 'school-1',
          roles: ['SCHOOL_ADMIN'],
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should hide users from other schools for scoped actors', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-123',
      schoolId: 'school-other',
      email: 'member@classivo.dev',
      phone: null,
      firstName: 'Mina',
      lastName: 'Member',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.findOne('user-123', {
        id: 'actor-1',
        schoolId: 'school-1',
        roles: ['SCHOOL_ADMIN'],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
