export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export function resolvePaginationParams(query: {
  page?: number;
  limit?: number;
}): PaginationParams {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  params: Pick<PaginationParams, 'page' | 'limit'>,
  total: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    },
  };
}

export function paginateArray<T>(
  items: T[],
  params: PaginationParams,
): PaginatedResult<T> {
  return buildPaginatedResult(
    items.slice(params.skip, params.skip + params.limit),
    params,
    items.length,
  );
}
