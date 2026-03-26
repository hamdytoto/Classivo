import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { executeListQuery } from '../../../../common/query/list-query.util';
import type { PaginationParams } from '../../../../common/pagination/pagination.util';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  USER_PERMISSIONS_SELECT,
  USER_PUBLIC_SELECT,
  USER_ROLES_SELECT,
} from '../../domain/users.constants';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput | Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({
      data,
      select: USER_PUBLIC_SELECT,
    });
  }

  findMany(
    where: Prisma.UserWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.UserOrderByWithRelationInput,
  ) {
    return this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: USER_PUBLIC_SELECT,
    });
  }

  count(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where });
  }

  findPage(
    where: Prisma.UserWhereInput,
    pagination: PaginationParams,
    orderBy: Prisma.UserOrderByWithRelationInput,
  ) {
    return executeListQuery({
      where,
      pagination,
      orderBy,
      findMany: (criteria, skip, take, sort) =>
        this.findMany(criteria, skip, take, sort),
      count: (criteria) => this.count(criteria),
      runInTransaction: (operations) => this.runInTransaction(operations),
    });
  }

  findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });
  }

  findScopeById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        schoolId: true,
      },
    });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_PUBLIC_SELECT,
    });
  }

  findRolesByUserId(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_ROLES_SELECT,
    });
  }

  findPermissionsByUserId(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PERMISSIONS_SELECT,
    });
  }

  findSchoolById(schoolId: string) {
    return this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });
  }

  runInTransaction<T, U>(
    operations: [Prisma.PrismaPromise<T>, Prisma.PrismaPromise<U>],
  ) {
    return this.prisma.$transaction(operations);
  }
}
