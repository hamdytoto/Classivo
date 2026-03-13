import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class AuthRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string) {
    return this.prisma.role.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }
}
