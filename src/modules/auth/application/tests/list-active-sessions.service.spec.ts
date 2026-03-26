import { Test, TestingModule } from '@nestjs/testing';
import { AuthSessionRepository } from '../../infrastructure/repositories/auth-session.repository';
import { ListActiveSessionsService } from '../list-active-sessions.service';

describe('ListActiveSessionsService', () => {
  let service: ListActiveSessionsService;

  const authSessionRepositoryMock = {
    listActiveByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListActiveSessionsService,
        {
          provide: AuthSessionRepository,
          useValue: authSessionRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ListActiveSessionsService>(ListActiveSessionsService);
    jest.clearAllMocks();
  });

  it('should list the active sessions for the authenticated actor', async () => {
    authSessionRepositoryMock.listActiveByUserId.mockResolvedValueOnce({
      data: [
        {
          id: 'session-1',
          lastUsedAt: new Date('2026-03-21T10:00:00.000Z'),
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    await expect(
      service.execute('user-1', {
        page: 1,
        limit: 20,
        sortBy: 'lastUsedAt',
        sortOrder: 'desc',
      }),
    ).resolves.toEqual({
      data: [
        {
          id: 'session-1',
          lastUsedAt: new Date('2026-03-21T10:00:00.000Z'),
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    expect(authSessionRepositoryMock.listActiveByUserId).toHaveBeenCalledWith(
      'user-1',
      {
        page: 1,
        limit: 20,
        sortBy: 'lastUsedAt',
        sortOrder: 'desc',
      },
    );
  });
});
