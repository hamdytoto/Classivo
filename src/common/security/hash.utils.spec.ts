import { compareHash, getSaltRounds, hash } from './hash.utils';

describe('hash.utils', () => {
  const originalSaltRounds = process.env.SALT_ROUND;

  afterEach(() => {
    process.env.SALT_ROUND = originalSaltRounds;
  });

  it('should hash and verify passwords with bcrypt', async () => {
    const hashedPassword = await hash('Password123!');

    expect(hashedPassword).not.toBe('Password123!');
    await expect(compareHash('Password123!', hashedPassword)).resolves.toBe(
      true,
    );
    await expect(compareHash('WrongPassword!', hashedPassword)).resolves.toBe(
      false,
    );
  });

  it('should use configured salt rounds when valid', () => {
    process.env.SALT_ROUND = '12';

    expect(getSaltRounds()).toBe(12);
  });

  it('should fall back to default salt rounds when config is invalid', () => {
    process.env.SALT_ROUND = 'invalid';

    expect(getSaltRounds()).toBe(10);
  });
});
