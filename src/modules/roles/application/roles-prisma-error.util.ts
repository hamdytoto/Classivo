import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaErrorHandlers } from '../../../common/database/prisma-error.util';

function buildUniqueConstraintException(target: string) {
  return new ConflictException({
    code: 'UNIQUE_CONSTRAINT_VIOLATION',
    message: `Duplicate value for ${target}`,
  });
}

function buildRelationNotFoundException() {
  return new NotFoundException({
    code: 'RELATION_NOT_FOUND',
    message: 'Requested relation was not found',
  });
}

export const createRoleEntityPrismaErrorHandlers: PrismaErrorHandlers = {
  onUnique: (target) => {
    throw buildUniqueConstraintException(target);
  },
};

export const updateRoleEntityPrismaErrorHandlers: PrismaErrorHandlers = {
  onUnique: (target) => {
    throw buildUniqueConstraintException(target);
  },
  onNotFound: () => {
    throw buildRelationNotFoundException();
  },
  onForeignKey: () => {
    throw buildRelationNotFoundException();
  },
};

export const roleAssignmentPrismaErrorHandlers: PrismaErrorHandlers = {
  onNotFound: () => {
    throw buildRelationNotFoundException();
  },
  onForeignKey: () => {
    throw new BadRequestException({
      code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
      message: 'Invalid related resource reference',
    });
  },
};
