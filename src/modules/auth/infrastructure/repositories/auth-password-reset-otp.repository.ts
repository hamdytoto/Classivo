import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class AuthPasswordResetOtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async invalidateActiveByUserId(
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.passwordResetOtp.updateMany({
      where: {
        userId,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  }

  async create(
    data: {
      userId: string;
      email: string;
      codeHash: string;
      expiresAt: Date;
      requestedIpAddress: string | null;
      requestedUserAgent: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.passwordResetOtp.create({ data });
  }

  async findLatestActiveByEmail(email: string) {
    return this.prisma.passwordResetOtp.findFirst({
      where: {
        email,
        consumedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        userId: true,
        codeHash: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }

  async findActiveDeliveryTargetById(id: string) {
    return this.prisma.passwordResetOtp.findFirst({
      where: {
        id,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
        email: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });
  }

  async deleteActiveByUserIdAndCodeHash(userId: string, codeHash: string) {
    return this.prisma.passwordResetOtp.deleteMany({
      where: {
        userId,
        consumedAt: null,
        codeHash,
      },
    });
  }

  async consumeActiveByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.passwordResetOtp.updateMany({
      where: {
        userId,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  }
}
