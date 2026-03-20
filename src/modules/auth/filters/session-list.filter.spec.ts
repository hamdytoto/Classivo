import { buildActiveSessionWhere } from './session-list.filter';

describe('session-list.filter', () => {
  it('should build Prisma where filters for active session listings', () => {
    expect(
      buildActiveSessionWhere('user-1', {
        ipAddress: '127.0.0',
        userAgent: 'chrome',
      }),
    ).toEqual({
      userId: 'user-1',
      revokedAt: null,
      ipAddress: {
        contains: '127.0.0',
      },
      userAgent: {
        contains: 'chrome',
        mode: 'insensitive',
      },
    });
  });
});
