import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  buildPaginatedResult,
  paginateArray,
  resolvePaginationParams,
} from '../../common/pagination/pagination.util';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { FindPermissionsQueryDto } from './dto/find-permissions-query.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { FindRoleUsersQueryDto } from './dto/find-role-users-query.dto';
import {
  buildPermissionWhere,
  buildRoleWhere,
  filterRoleUsers,
} from './filters/role-list.filter';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const ROLE_SELECT = {
  id: true,
  code: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    select: {
      permission: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  },
} as const;

const ROLE_USERS_SELECT = {
  id: true,
  code: true,
  name: true,
  users: {
    select: {
      assignedAt: true,
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
    orderBy: {
      assignedAt: 'desc',
    },
  },
} as const;

const PERMISSION_SELECT = {
  id: true,
  code: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(dto: CreateRoleDto) {
    try {
      return await this.prisma.role.create({
        data: dto,
        select: ROLE_SELECT,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAllRoles(query: FindRolesQueryDto = {}) {
    const pagination = resolvePaginationParams(query);
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = buildRoleWhere(query);

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [sortBy]: sortOrder },
        select: ROLE_SELECT,
      }),
      this.prisma.role.count({ where }),
    ]);

    return buildPaginatedResult(roles, pagination, total);
  }

  async findOneRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: ROLE_SELECT,
    });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    return role;
  }

  async findUsersForRole(roleId: string, query: FindRoleUsersQueryDto = {}) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: ROLE_USERS_SELECT,
    });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    const sortBy = query.sortBy ?? 'assignedAt';
    const sortOrder = query.sortOrder ?? 'desc';
    let users = role.users.map((assignment) => ({
      assignedAt: assignment.assignedAt,
      ...assignment.user,
    }));
    users = filterRoleUsers(users, query);

    users.sort((left, right) =>
      this.compareValues(left[sortBy], right[sortBy], sortOrder),
    );

    return {
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      ...paginateArray(users, resolvePaginationParams(query)),
    };
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    try {
      return await this.prisma.role.update({
        where: { id },
        data: dto,
        select: ROLE_SELECT,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async createPermission(dto: CreatePermissionDto) {
    try {
      return await this.prisma.permission.create({
        data: dto,
        select: PERMISSION_SELECT,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAllPermissions(query: FindPermissionsQueryDto = {}) {
    const pagination = resolvePaginationParams(query);
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = buildPermissionWhere(query);

    const [permissions, total] = await this.prisma.$transaction([
      this.prisma.permission.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [sortBy]: sortOrder },
        select: PERMISSION_SELECT,
      }),
      this.prisma.permission.count({ where }),
    ]);

    return buildPaginatedResult(permissions, pagination, total);
  }

  async findOnePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: PERMISSION_SELECT,
    });

    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_NOT_FOUND',
        message: 'Permission not found',
      });
    }

    return permission;
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    try {
      return await this.prisma.permission.update({
        where: { id },
        data: dto,
        select: PERMISSION_SELECT,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    await this.ensureRoleExists(roleId);
    await this.ensurePermissionExists(permissionId);

    try {
      await this.prisma.rolePermission.upsert({
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
    } catch (error) {
      this.handlePrismaError(error);
    }

    return this.findOneRole(roleId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    try {
      await this.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }

    return this.findOneRole(roleId);
  }

  async assignRoleToUser(userId: string, roleId: string) {
    await this.ensureRoleExists(roleId);
    await this.ensureUserExists(userId);

    try {
      await this.prisma.userRole.upsert({
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
    } catch (error) {
      this.handlePrismaError(error);
    }

    return {
      userId,
      roleId,
      assigned: true,
    };
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    try {
      await this.prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }

    return {
      userId,
      roleId,
      assigned: false,
    };
  }

  private async ensureRoleExists(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }
  }

  private async ensurePermissionExists(permissionId: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
      select: { id: true },
    });

    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_NOT_FOUND',
        message: 'Permission not found',
      });
    }
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
  }

  private handlePrismaError(error: unknown): never {
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

      if (error.code === 'P2003') {
        throw new BadRequestException({
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'Invalid related resource reference',
        });
      }
    }

    throw error;
  }

  private compareValues(
    left: Date | string | null | undefined,
    right: Date | string | null | undefined,
    sortOrder: 'asc' | 'desc',
  ) {
    const direction = sortOrder === 'asc' ? 1 : -1;

    if (left instanceof Date && right instanceof Date) {
      return (left.getTime() - right.getTime()) * direction;
    }

    return String(left ?? '').localeCompare(String(right ?? '')) * direction;
  }
}
