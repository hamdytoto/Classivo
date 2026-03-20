import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS_KEY } from '../../common/constants/auth.constants';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findRoles: jest.fn(),
    findPermissions: jest.fn(),
    update: jest.fn(),
    me: jest.fn(),
  };
  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };
  const reflectorMock = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: Reflector,
          useValue: reflectorMock,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should protect sensitive user routes with permission metadata', () => {
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.create),
    ).toEqual(['users.manage']);
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.findAll),
    ).toEqual(['users.read']);
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.findRoles),
    ).toEqual(['users.read']);
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        UsersController.prototype.findPermissions,
      ),
    ).toEqual(['users.read']);
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.findOne),
    ).toEqual(['users.read']);
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.update),
    ).toEqual(['users.manage']);
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, UsersController.prototype.me),
    ).toBeUndefined();
  });

  it('should resolve current user from request.user', async () => {
    (usersServiceMock.me as jest.Mock).mockResolvedValueOnce({
      id: 'user-123',
    });

    const result = await controller.me({
      user: {
        id: 'user-123',
      },
    } as never);

    expect(usersServiceMock.me).toHaveBeenCalledWith('user-123');
    expect(result).toEqual({
      id: 'user-123',
    });
  });

  it('should delegate user role inspection to the service', async () => {
    (usersServiceMock.findRoles as jest.Mock).mockResolvedValueOnce({
      userId: 'user-123',
      data: [
        {
          id: 'role-1',
          code: 'SCHOOL_ADMIN',
          name: 'School Admin',
          assignedAt: new Date('2026-03-13T00:00:00.000Z'),
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const result = await controller.findRoles('user-123', {} as never);

    expect(usersServiceMock.findRoles).toHaveBeenCalledWith('user-123', {});
    expect(result).toEqual({
      userId: 'user-123',
      data: [
        {
          id: 'role-1',
          code: 'SCHOOL_ADMIN',
          name: 'School Admin',
          assignedAt: new Date('2026-03-13T00:00:00.000Z'),
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

  it('should delegate user permission inspection to the service', async () => {
    (usersServiceMock.findPermissions as jest.Mock).mockResolvedValueOnce({
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
          ],
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const result = await controller.findPermissions('user-123', {} as never);

    expect(usersServiceMock.findPermissions).toHaveBeenCalledWith('user-123', {});
    expect(result).toEqual({
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
          ],
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
