import { Prisma } from '@prisma/client';

type PrismaErrorHandlers = {
  onUnique?: (target: string) => never;
  onNotFound?: () => never;
  onForeignKey?: (fieldName: string) => never;
};

export function rethrowPrismaError(
  error: unknown,
  handlers: PrismaErrorHandlers,
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002' && handlers.onUnique) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(', ')
        : 'unique field';
      return handlers.onUnique(target);
    }

    if (error.code === 'P2025' && handlers.onNotFound) {
      return handlers.onNotFound();
    }

    if (error.code === 'P2003' && handlers.onForeignKey) {
      const fieldName =
        typeof error.meta?.field_name === 'string' ? error.meta.field_name : '';
      return handlers.onForeignKey(fieldName);
    }
  }

  throw error;
}
