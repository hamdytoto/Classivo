import { Prisma } from '@prisma/client';
import { ListActiveSessionsQueryDto } from '../interface/dto/list-active-sessions-query.dto';

export function buildActiveSessionWhere(
  userId: string,
  query: ListActiveSessionsQueryDto,
): Prisma.SessionWhereInput {
  const where: Prisma.SessionWhereInput = {
    userId,
    revokedAt: null,
  };

  if (query.ipAddress) {
    where.ipAddress = {
      contains: query.ipAddress,
    };
  }

  if (query.userAgent) {
    where.userAgent = {
      contains: query.userAgent,
      mode: 'insensitive',
    };
  }

  return where;
}
