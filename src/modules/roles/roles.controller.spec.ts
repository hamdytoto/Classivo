import { Test, TestingModule } from '@nestjs/testing';
import { ROLES_KEY } from '../../common/constants/auth.constants';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  const rolesServiceMock = {
    createRole: jest.fn(),
    findAllRoles: jest.fn(),
    findOneRole: jest.fn(),
    findUsersForRole: jest.fn(),
    updateRole: jest.fn(),
    createPermission: jest.fn(),
    findAllPermissions: jest.fn(),
    findOnePermission: jest.fn(),
    updatePermission: jest.fn(),
    assignPermissionToRole: jest.fn(),
    removePermissionFromRole: jest.fn(),
    assignRoleToUser: jest.fn(),
    removeRoleFromUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: rolesServiceMock,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should require the SUPER_ADMIN role for all role routes', () => {
    expect(Reflect.getMetadata(ROLES_KEY, RolesController)).toEqual([
      'SUPER_ADMIN',
    ]);
  });

  it('should delegate role-user inspection to the service', async () => {
    (rolesServiceMock.findUsersForRole as jest.Mock).mockResolvedValueOnce({
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

    const result = await controller.findUsersForRole('role-1', {} as never);

    expect(rolesServiceMock.findUsersForRole).toHaveBeenCalledWith('role-1', {});
    expect(result).toEqual({
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
});
