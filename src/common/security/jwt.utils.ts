import { createHash } from 'crypto';

type JwtTokenConfig = {
  secret: string;
  expiresIn: string | number;
  expiresInSeconds: number;
};

export function getJwtAccessTokenConfig(): JwtTokenConfig {
  return getJwtTokenConfig({
    secretEnvKey: 'JWT_ACCESS_SECRET',
    ttlEnvKey: 'JWT_ACCESS_TTL',
    defaultTtl: '15m',
  });
}

export function getJwtRefreshTokenConfig(): JwtTokenConfig {
  return getJwtTokenConfig({
    secretEnvKey: 'JWT_REFRESH_SECRET',
    ttlEnvKey: 'JWT_REFRESH_TTL',
    defaultTtl: '7d',
  });
}

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function getJwtTokenConfig(options: {
  secretEnvKey: string;
  ttlEnvKey: string;
  defaultTtl: string;
}): JwtTokenConfig {
  const secret = process.env[options.secretEnvKey]?.trim();
  const expiresIn = process.env[options.ttlEnvKey] ?? options.defaultTtl;

  if (!secret) {
    throw new Error(`${options.secretEnvKey} is required`);
  }

  return {
    secret,
    expiresIn,
    expiresInSeconds: parseJwtTtlToSeconds(expiresIn),
  };
}

export function parseJwtTtlToSeconds(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('JWT TTL must be a positive number');
    }

    return Math.floor(value);
  }

  const normalized = value.trim();
  const exactNumber = Number(normalized);

  if (Number.isFinite(exactNumber) && exactNumber > 0) {
    return Math.floor(exactNumber);
  }

  const match = /^(\d+)\s*([smhd])$/i.exec(normalized);

  if (!match) {
    throw new Error(`Invalid JWT TTL format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return amount * multipliers[unit];
}
