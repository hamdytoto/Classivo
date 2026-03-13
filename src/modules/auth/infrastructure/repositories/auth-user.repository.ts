import { Injectable } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { AUTH_ME_SELECT, AUTH_USER_SELECT } from '../../domain/auth.constants';

@Injectable()
export class AuthUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findForLogin(identifier: { email: string } | { phone: string }) {
    return this.prisma.user.findUnique({
      where: identifier,
      select: {
        id: true,
        status: true,
        passwordHash: true,
      },
    });
  }

  async touchLastLoginAndGetAuthUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
      select: AUTH_USER_SELECT,
    });
  }

  async findAuthProfileById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: AUTH_ME_SELECT,
    });
  }

  async createSchoolOwner(
    data: {
      schoolId: string;
      email: string;
      phone: string | null;
      passwordHash: string;
      firstName: string;
      lastName: string;
      status: UserStatus;
    },
    tx: Prisma.TransactionClient,
  ) {
    return tx.user.create({
      data,
      select: AUTH_USER_SELECT,
    });
  }

  async findForPasswordChange(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
        status: true,
      },
    });
  }

  async findForForgotPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        status: true,
      },
    });
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
    tx?: Prisma.TransactionClient,
    updatedAt?: Date,
  ) {
    const client = tx ?? this.prisma;

    return client.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        ...(updatedAt ? { updatedAt } : {}),
      },
    });
  }
}
