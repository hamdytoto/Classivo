import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { RevokeSessionService } from '../revoke-session.service';

describe('RevokeSessionService', () => {
  let service: RevokeSessionService;

  const authSessionRepositoryMock = {
    findById: jest.fn(),
    revokeById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevokeSessionService,
        {
          provide: AuthSessionRepository,
          useValue: authSessionRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<RevokeSessionService>(RevokeSessionService);
    jest.clearAllMocks();
  });

  it('should revoke an active session that belongs to the actor', async () => {
    authSessionRepositoryMock.findById.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'user-1',
      revokedAt: null,
    });
    authSessionRepositoryMock.revokeById.mockResolvedValueOnce(undefined);

    await expect(
      service.execute('session-1', 'user-1'),
    ).resolves.toBeUndefined();

    expect(authSessionRepositoryMock.revokeById).toHaveBeenCalledWith(
      'session-1',
      expect.any(Date),
    );
  });

  it('should reject when the session belongs to another user', async () => {
    authSessionRepositoryMock.findById.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'user-2',
      revokedAt: null,
    });

    await expect(
      service.execute('session-1', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(authSessionRepositoryMock.revokeById).not.toHaveBeenCalled();
  });
});
