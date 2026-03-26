import {
  rethrowPrismaError,
  type PrismaErrorHandlers,
} from './prisma-error.util';

export async function executePrismaOperation<T>(
  operation: Promise<T>,
  handlers: PrismaErrorHandlers,
): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    return rethrowPrismaError(error, handlers);
  }
}
