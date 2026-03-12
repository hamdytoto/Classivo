import {
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            const target = Array.isArray(error.meta?.target)
                ? error.meta.target.join(', ')
                : 'unique field';
            throw new ConflictException({
                code: 'UNIQUE_CONSTRAINT_VIOLATION',
                message: `Duplicate value for ${target}`,
            });
        }

        if (error.code === 'P2025') {
            throw new NotFoundException({
                code: 'RELATION_NOT_FOUND',
                message: 'Requested relation was not found',
            });
        }
    }

    throw error;
}