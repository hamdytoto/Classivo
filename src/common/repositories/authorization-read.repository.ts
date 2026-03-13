import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthorizationReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRoleCodesByUserId(userId: string): Promise<string[]> {
    const assignments = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            code: true,
          },
        },
      },
    });

    return assignments.map((assignment) => assignment.role.code);
  }

  async findPermissionCodesByUserId(userId: string): Promise<string[]> {
    const assignments = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return [
      ...new Set(
        assignments.flatMap((assignment) =>
          assignment.role.permissions.map((entry) => entry.permission.code),
        ),
      ),
    ];
  }
}
