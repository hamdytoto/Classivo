export function getJwtAccessTokenConfig(): {
  secret: string;
  expiresIn: string | number;
  expiresInSeconds: number;
} {
  const secret = process.env.JWT_ACCESS_SECRET?.trim();
  const expiresIn = process.env.JWT_ACCESS_TTL ?? '15m';

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is required');
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
