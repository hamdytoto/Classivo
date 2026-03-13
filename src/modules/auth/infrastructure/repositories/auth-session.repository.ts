import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';

export type AuthSessionRecord = NonNullable<
  Awaited<ReturnType<AuthSessionRepository['findById']>>
>;

export type AuthSessionWithUserRecord = NonNullable<
  Awaited<ReturnType<AuthSessionRepository['findByIdWithUser']>>
>;

@Injectable()
export class AuthSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: {
      id: string;
      userId: string;
      refreshTokenHash: string;
      ipAddress: string | null;
      userAgent: string | null;
      expiresAt: Date;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.session.create({ data });
  }

  async findById(sessionId: string) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
  }

  async findByIdWithUser(sessionId: string) {
    return this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        refreshTokenHash: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            schoolId: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async listActiveByUserId(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async rotate(
    params: {
      sessionId: string;
      refreshTokenHash: string;
      expiresAt: Date;
      ipAddress: string | null;
      userAgent: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.session.update({
      where: { id: params.sessionId },
      data: {
        refreshTokenHash: params.refreshTokenHash,
        expiresAt: params.expiresAt,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async revokeById(
    sessionId: string,
    revokedAt: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    });
  }

  async revokeManyByUserId(
    userId: string,
    revokedAt: Date,
    excludeSessionId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(excludeSessionId ? { NOT: { id: excludeSessionId } } : {}),
      },
      data: {
        revokedAt,
      },
    });
  }
}
