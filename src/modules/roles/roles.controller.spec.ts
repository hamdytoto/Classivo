import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  let controller: RolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: {
            createRole: jest.fn(),
            findAllRoles: jest.fn(),
            findOneRole: jest.fn(),
            updateRole: jest.fn(),
            createPermission: jest.fn(),
            findAllPermissions: jest.fn(),
            findOnePermission: jest.fn(),
            updatePermission: jest.fn(),
            assignPermissionToRole: jest.fn(),
            removePermissionFromRole: jest.fn(),
            assignRoleToUser: jest.fn(),
            removeRoleFromUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

