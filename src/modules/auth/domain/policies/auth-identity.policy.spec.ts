import { UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AUTH_ERROR_CODES } from '../auth-errors';
import { AuthIdentityPolicy } from './auth-identity.policy';

describe('AuthIdentityPolicy', () => {
  let policy: AuthIdentityPolicy;

  beforeEach(() => {
    policy = new AuthIdentityPolicy();
  });

  it('should allow active users to authenticate', () => {
    expect(() => policy.assertUserIsActive(UserStatus.ACTIVE)).not.toThrow();
  });

  it.each([
    [
      UserStatus.SUSPENDED,
      AUTH_ERROR_CODES.accountSuspended,
      'Account is suspended',
    ],
    [
      UserStatus.DISABLED,
      AUTH_ERROR_CODES.accountDisabled,
      'Account is disabled',
    ],
  ])('should reject %s users from authenticating', (status, code, message) => {
    try {
      policy.assertUserIsActive(status);
      fail('Expected assertUserIsActive to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toEqual({
        code,
        message,
      });
    }
  });
});
