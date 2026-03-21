import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUDIT_ACTIONS } from '../../common/audit/audit.constants';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;

  const prismaMock = {
    $transaction: jest.fn(),
    role: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    permission: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rolePermission: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    userRole: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;
  const auditLogServiceMock = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: AuditLogService,
          useValue: auditLogServiceMock,
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

  it('should return users assigned to an existing role', async () => {
    (prismaMock.role.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'role-1',
      code: 'SCHOOL_ADMIN',
      name: 'School Admin',
      users: [
        {
          assignedAt: new Date('2026-03-14T00:00:00.000Z'),
          user: {
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
        },
      ],
    });

    await expect(service.findUsersForRole('role-1')).resolves.toEqual({
      roleId: 'role-1',
      roleCode: 'SCHOOL_ADMIN',
      roleName: 'School Admin',
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
          assignedAt: new Date('2026-03-14T00:00:00.000Z'),
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('should reject role-user inspection when the role does not exist', async () => {
    (prismaMock.role.findUnique as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.findUsersForRole('missing-role'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should paginate filtered role listings with shared metadata', async () => {
    (prismaMock.role.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'role-1',
        code: 'SCHOOL_ADMIN',
        name: 'School Admin',
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        updatedAt: new Date('2026-03-13T00:00:00.000Z'),
        permissions: [],
      },
    ]);
    (prismaMock.role.count as jest.Mock).mockResolvedValueOnce(1);
    (prismaMock.$transaction as jest.Mock).mockImplementationOnce(
      (operations) => Promise.all(operations),
    );

    await expect(
      service.findAllRoles({
        page: 1,
        limit: 10,
        code: 'ADMIN',
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    ).resolves.toEqual({
      data: [
        {
          id: 'role-1',
          code: 'SCHOOL_ADMIN',
          name: 'School Admin',
          createdAt: new Date('2026-03-13T00:00:00.000Z'),
          updatedAt: new Date('2026-03-13T00:00:00.000Z'),
          permissions: [],
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    expect(prismaMock.role.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        where: {
          code: {
            contains: 'ADMIN',
            mode: 'insensitive',
          },
        },
      }),
    );
  });

  it('should audit permission assignment to a role', async () => {
    const tx = {
      rolePermission: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    (prismaMock.role.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'role-1',
        code: 'SCHOOL_ADMIN',
        name: 'School Admin',
      })
      .mockResolvedValueOnce({
        id: 'role-1',
        code: 'SCHOOL_ADMIN',
        name: 'School Admin',
        createdAt: new Date('2026-03-13T00:00:00.000Z'),
        updatedAt: new Date('2026-03-13T00:00:00.000Z'),
        permissions: [],
      });
    (prismaMock.permission.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'permission-1',
      code: 'users.manage',
      name: 'Manage users',
    });
    (prismaMock.rolePermission.findUnique as jest.Mock).mockResolvedValueOnce(
      null,
    );
    (prismaMock.$transaction as jest.Mock).mockImplementationOnce((callback) =>
      callback(tx),
    );
    (auditLogServiceMock.log as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(
      service.assignPermissionToRole('role-1', 'permission-1', 'actor-1'),
    ).resolves.toEqual({
      id: 'role-1',
      code: 'SCHOOL_ADMIN',
      name: 'School Admin',
      createdAt: new Date('2026-03-13T00:00:00.000Z'),
      updatedAt: new Date('2026-03-13T00:00:00.000Z'),
      permissions: [],
    });

    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.permissionAssigned,
        resource: 'role',
        resourceId: 'role-1',
        actorId: 'actor-1',
        metadata: expect.objectContaining({
          permissionCode: 'users.manage',
          alreadyAssigned: false,
        }),
      }),
      tx,
    );
  });

  it('should audit role assignment to a user', async () => {
    const tx = {
      userRole: {
        upsert: jest.fn().mockResolvedValue(undefined),
      },
    };

    (prismaMock.role.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'role-1',
      code: 'SCHOOL_ADMIN',
      name: 'School Admin',
    });
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'user-1',
      schoolId: 'school-1',
    });
    (prismaMock.userRole.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (prismaMock.$transaction as jest.Mock).mockImplementationOnce((callback) =>
      callback(tx),
    );
    (auditLogServiceMock.log as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(
      service.assignRoleToUser('user-1', 'role-1', 'actor-1'),
    ).resolves.toEqual({
      userId: 'user-1',
      roleId: 'role-1',
      assigned: true,
    });

    expect(auditLogServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.roleAssigned,
        resource: 'user',
        resourceId: 'user-1',
        actorId: 'actor-1',
        schoolId: 'school-1',
        metadata: expect.objectContaining({
          roleCode: 'SCHOOL_ADMIN',
          alreadyAssigned: false,
        }),
      }),
      tx,
    );
  });
});
