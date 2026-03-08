import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
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
});
