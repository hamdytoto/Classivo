import { Prisma } from '@prisma/client';
import type { PrismaErrorHandlers } from '../database/prisma-error.util';
import { rethrowPrismaError } from '../database/prisma-error.util';
import { SortOrder } from '../dto/pagination-query.dto';
import {
  buildPaginatedResult,
  resolvePaginationParams,
  type PaginatedResult,
  type PaginationParams,
} from '../pagination/pagination.util';

type PaginationSortQuery<TSortBy extends string> = {
  page?: number;
  limit?: number;
  sortBy?: TSortBy;
  sortOrder?: SortOrder;
};

type ExecuteListQueryOptions<TItem, TWhere, TOrderBy> = {
  where: TWhere;
  pagination: PaginationParams;
  orderBy: TOrderBy;
  findMany: (
    where: TWhere,
    skip: number,
    take: number,
    orderBy: TOrderBy,
  ) => Prisma.PrismaPromise<TItem[]>;
  count: (where: TWhere) => Prisma.PrismaPromise<number>;
  runInTransaction: (
    operations: [Prisma.PrismaPromise<TItem[]>, Prisma.PrismaPromise<number>],
  ) => Promise<[TItem[], number]>;
  errorHandlers?: PrismaErrorHandlers;
};

export function resolveListQuery<TSortBy extends string, TOrderBy>(
  query: PaginationSortQuery<TSortBy>,
  defaultSortBy: TSortBy,
): {
  pagination: PaginationParams;
  sortBy: TSortBy;
  sortOrder: SortOrder;
  orderBy: TOrderBy;
} {
  const pagination = resolvePaginationParams(query);
  const sortBy = query.sortBy ?? defaultSortBy;
  const sortOrder = query.sortOrder ?? SortOrder.desc;

  return {
    pagination,
    sortBy,
    sortOrder,
    orderBy: {
      [sortBy]: sortOrder,
    } as TOrderBy,
  };
}

export async function executeListQuery<TItem, TWhere, TOrderBy>({
  where,
  pagination,
  orderBy,
  findMany,
  count,
  runInTransaction,
  errorHandlers,
}: ExecuteListQueryOptions<TItem, TWhere, TOrderBy>): Promise<
  PaginatedResult<TItem>
> {
  try {
    const [data, total] = await runInTransaction([
      findMany(where, pagination.skip, pagination.limit, orderBy),
      count(where),
    ]);

    return buildPaginatedResult(data, pagination, total);
  } catch (error) {
    if (errorHandlers) {
      return rethrowPrismaError(error, errorHandlers);
    }

    throw error;
  }
}
