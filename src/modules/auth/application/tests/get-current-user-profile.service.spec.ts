import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUserProfileBuilder } from '../../domain/builders/authenticated-user-profile.builder';
import { AuthUserRepository } from '../../infrastructure/repositories/auth-user.repository';
import { GetCurrentUserProfileService } from '../get-current-user-profile.service';

describe('GetCurrentUserProfileService', () => {
  let service: GetCurrentUserProfileService;

  const authUserRepositoryMock = {
    findAuthProfileById: jest.fn(),
  };
  const authenticatedUserProfileBuilderMock = {
    build: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCurrentUserProfileService,
        {
          provide: AuthUserRepository,
          useValue: authUserRepositoryMock,
        },
        {
          provide: AuthenticatedUserProfileBuilder,
          useValue: authenticatedUserProfileBuilderMock,
        },
      ],
    }).compile();

    service = module.get<GetCurrentUserProfileService>(
      GetCurrentUserProfileService,
    );
    jest.clearAllMocks();
  });

  it('should build the authenticated profile for an existing actor', async () => {
    authUserRepositoryMock.findAuthProfileById.mockResolvedValueOnce({
      id: 'user-1',
      roles: [],
    });
    authenticatedUserProfileBuilderMock.build.mockReturnValueOnce({
      id: 'user-1',
      roles: ['SCHOOL_ADMIN'],
      permissions: ['users.read'],
    });

    await expect(service.execute('user-1')).resolves.toEqual({
      id: 'user-1',
      roles: ['SCHOOL_ADMIN'],
      permissions: ['users.read'],
    });

    expect(authUserRepositoryMock.findAuthProfileById).toHaveBeenCalledWith(
      'user-1',
    );
    expect(authenticatedUserProfileBuilderMock.build).toHaveBeenCalledWith({
      id: 'user-1',
      roles: [],
    });
  });

  it('should reject when the authenticated actor does not exist', async () => {
    authUserRepositoryMock.findAuthProfileById.mockResolvedValueOnce(null);

    await expect(service.execute('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(authenticatedUserProfileBuilderMock.build).not.toHaveBeenCalled();
  });
});
