import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    getStatus: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate login to auth service', async () => {
    (authServiceMock.login as jest.Mock).mockResolvedValueOnce({
      user: { id: 'b6513f67-fe56-4a84-a9ae-bff34d8ae370' },
    });

    const result = await controller.login({
      email: 'john@classivo.dev',
      password: 'Password123',
    });

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'john@classivo.dev',
      password: 'Password123',
    });
    expect(result).toEqual({
      user: { id: 'b6513f67-fe56-4a84-a9ae-bff34d8ae370' },
    });
  });
});
