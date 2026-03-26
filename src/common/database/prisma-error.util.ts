import { Prisma } from '@prisma/client';

export type PrismaErrorHandlers = {
  onUnique?: (target: string) => never | void;
  onNotFound?: () => never | void;
  onForeignKey?: (fieldName: string) => never | void;
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
      const result = handlers.onUnique(target);

      if (result !== undefined) {
        return result;
      }
    }

    if (error.code === 'P2025' && handlers.onNotFound) {
      const result = handlers.onNotFound();

      if (result !== undefined) {
        return result;
      }
    }

    if (error.code === 'P2003' && handlers.onForeignKey) {
      const fieldName =
        typeof error.meta?.field_name === 'string' ? error.meta.field_name : '';
      const result = handlers.onForeignKey(fieldName);

      if (result !== undefined) {
        return result;
      }
    }
  }

  throw error;
}
