export type RedisConnectionOptions = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
};

export function getRedisUrl(): string {
  return process.env.REDIS_URL ?? 'redis://localhost:6379';
}

export function getRedisConnectionOptions(): RedisConnectionOptions {
  const redisUrl = new URL(getRedisUrl());
  const db = redisUrl.pathname
    ? Number(redisUrl.pathname.replace('/', ''))
    : undefined;

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: Number.isNaN(db) ? undefined : db,
  };
}
