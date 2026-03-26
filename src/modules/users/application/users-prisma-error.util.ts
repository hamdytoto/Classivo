import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaErrorHandlers } from '../../../common/database/prisma-error.util';

function buildUniqueConstraintException(target: string) {
  return new ConflictException({
    code: 'UNIQUE_CONSTRAINT_VIOLATION',
    message: `Duplicate value for ${target}`,
  });
}

export const createUserPrismaErrorHandlers: PrismaErrorHandlers = {
  onUnique: (target) => {
    throw buildUniqueConstraintException(target);
  },
  onForeignKey: (fieldName) => {
    if (fieldName.includes('schoolId')) {
      throw new NotFoundException({
        code: 'INVALID_SCHOOL_ID',
        message: 'Invalid schoolId',
      });
    }
  },
};

export const updateUserPrismaErrorHandlers: PrismaErrorHandlers = {
  onUnique: (target) => {
    throw buildUniqueConstraintException(target);
  },
  onNotFound: () => {
    throw new NotFoundException({
      code: 'USER_NOT_FOUND',
      message: 'User not found',
    });
  },
};
