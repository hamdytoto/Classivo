import bcryptjs from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 10;

export function getSaltRounds(): number {
  const configuredRounds = Number(process.env.SALT_ROUND);

  if (Number.isInteger(configuredRounds) && configuredRounds > 0) {
    return configuredRounds;
  }

  return DEFAULT_SALT_ROUNDS;
}

export function hash(text: string, saltRounds: number = getSaltRounds()) {
  return bcryptjs.hash(text, saltRounds);
}

export function compareHash(text: string, hashedText: string) {
  return bcryptjs.compare(text, hashedText);
}

