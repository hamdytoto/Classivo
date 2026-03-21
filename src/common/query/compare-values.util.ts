export function compareSortableValues(
  left: Date | string | null | undefined,
  right: Date | string | null | undefined,
  sortOrder: 'asc' | 'desc',
) {
  const direction = sortOrder === 'asc' ? 1 : -1;

  if (left instanceof Date && right instanceof Date) {
    return (left.getTime() - right.getTime()) * direction;
  }

  return String(left ?? '').localeCompare(String(right ?? '')) * direction;
}
