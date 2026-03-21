import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  PERMISSION_SELECT,
  ROLE_SELECT,
  ROLE_USERS_SELECT,
} from '../../domain/roles.constants';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  createRole(data: Prisma.RoleCreateInput) {
    return this.prisma.role.create({
      data,
      select: ROLE_SELECT,
    });
  }

  findRoles(
    where: Prisma.RoleWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.RoleOrderByWithRelationInput,
  ) {
    return this.prisma.role.findMany({
      where,
      skip,
      take,
      orderBy,
      select: ROLE_SELECT,
    });
  }

  countRoles(where: Prisma.RoleWhereInput) {
    return this.prisma.role.count({ where });
  }

  findRoleById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      select: ROLE_SELECT,
    });
  }

  findRoleSummaryById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });
  }

  findRoleUsersByRoleId(roleId: string) {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      select: ROLE_USERS_SELECT,
    });
  }

  updateRole(id: string, data: Prisma.RoleUpdateInput) {
    return this.prisma.role.update({
      where: { id },
      data,
      select: ROLE_SELECT,
    });
  }

  createPermission(data: Prisma.PermissionCreateInput) {
    return this.prisma.permission.create({
      data,
      select: PERMISSION_SELECT,
    });
  }

  findPermissions(
    where: Prisma.PermissionWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.PermissionOrderByWithRelationInput,
  ) {
    return this.prisma.permission.findMany({
      where,
      skip,
      take,
      orderBy,
      select: PERMISSION_SELECT,
    });
  }

  countPermissions(where: Prisma.PermissionWhereInput) {
    return this.prisma.permission.count({ where });
  }

  findPermissionById(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
      select: PERMISSION_SELECT,
    });
  }

  findPermissionSummaryById(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });
  }

  updatePermission(id: string, data: Prisma.PermissionUpdateInput) {
    return this.prisma.permission.update({
      where: { id },
      data,
      select: PERMISSION_SELECT,
    });
  }

  findRolePermissionAssignment(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      select: {
        roleId: true,
      },
    });
  }

  upsertRolePermission(
    roleId: string,
    permissionId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId,
      },
    });
  }

  deleteRolePermission(
    roleId: string,
    permissionId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }

  findUserRoleAssignment(userId: string, roleId: string) {
    return this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      select: {
        userId: true,
      },
    });
  }

  upsertUserRole(
    userId: string,
    roleId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {},
      create: {
        userId,
        roleId,
      },
    });
  }

  deleteUserRole(
    userId: string,
    roleId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  findUserScopeById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true },
    });
  }

  runInTransaction<T, U>(
    operations: [Prisma.PrismaPromise<T>, Prisma.PrismaPromise<U>],
  ) {
    return this.prisma.$transaction(operations);
  }
}
