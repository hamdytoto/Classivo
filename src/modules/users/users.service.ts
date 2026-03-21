import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { hash } from '../../common/security/hash.utils';
import type { AuthenticatedActor } from '../../common/types/request-context.type';
import { Role } from '../../common/enums/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserPermissionsQueryDto } from './dto/find-user-permissions-query.dto';
import { FindUserRolesQueryDto } from './dto/find-user-roles-query.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import {
  buildUserWhere,
  filterUserPermissions,
  filterUserRoles,
} from './filters/user-list.filter';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_PUBLIC_SELECT = {
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
} as const;

const USER_ROLES_SELECT = {
  id: true,
  schoolId: true,
  roles: {
    select: {
      assignedAt: true,
      role: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      assignedAt: 'desc',
    },
  },
} as const;

const USER_PERMISSIONS_SELECT = {
  id: true,
  schoolId: true,
  roles: {
    select: {
      role: {
        select: {
          id: true,
          code: true,
          name: true,
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
        },
      },
    },
  },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, actor?: AuthenticatedActor) {
    this.ensureContactProvided(createUserDto.email, createUserDto.phone);
    const schoolId = this.resolveRequestedSchoolId(actor, createUserDto.schoolId);
    await this.ensureSchoolExists(schoolId);

    const passwordHash = await hash(createUserDto.password);

    try {
      return await this.prisma.user.create({
        data: {
          schoolId,
          email: createUserDto.email,
          phone: createUserDto.phone,
          passwordHash,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          status: createUserDto.status,
        },
        select: USER_PUBLIC_SELECT,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(query: FindUsersQueryDto, actor?: AuthenticatedActor) {
    const scopedQuery = this.applySchoolScopeToUserQuery(query, actor);
    const pagination = resolvePaginationParams(query);
    const where = buildUserWhere(scopedQuery);
    const sortBy = scopedQuery.sortBy ?? 'createdAt';
    const sortOrder = scopedQuery.sortOrder ?? 'desc';

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [sortBy]: sortOrder },
        select: USER_PUBLIC_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(users, pagination, total);
  }

  async findOne(id: string, actor?: AuthenticatedActor) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    this.ensureActorCanAccessUserSchool(actor, user.schoolId);

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actor?: AuthenticatedActor,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        schoolId: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.ensureActorCanAccessUserSchool(actor, existingUser.schoolId);

    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.email !== undefined) {
      data.email = updateUserDto.email;
    }

    if (updateUserDto.phone !== undefined) {
      data.phone = updateUserDto.phone;
    }

    if (updateUserDto.firstName !== undefined) {
      data.firstName = updateUserDto.firstName;
    }

    if (updateUserDto.lastName !== undefined) {
      data.lastName = updateUserDto.lastName;
    }

    if (updateUserDto.status !== undefined) {
      data.status = updateUserDto.status;
    }

    if (updateUserDto.password !== undefined) {
      data.passwordHash = await hash(updateUserDto.password);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: USER_PUBLIC_SELECT,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async me(userId: string) {
    return this.findOne(userId);
  }

  async findRoles(
    userId: string,
    query: FindUserRolesQueryDto = {},
    actor?: AuthenticatedActor,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_ROLES_SELECT,
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.ensureActorCanAccessUserSchool(actor, user.schoolId);

    const sortBy = query.sortBy ?? 'assignedAt';
    const sortOrder = query.sortOrder ?? 'desc';
    let roles = user.roles.map((assignment) => ({
      id: assignment.role.id,
      code: assignment.role.code,
      name: assignment.role.name,
      assignedAt: assignment.assignedAt,
    }));
    roles = filterUserRoles(roles, query);

    roles.sort((left, right) =>
      this.compareValues(left[sortBy], right[sortBy], sortOrder),
    );

    return {
      userId: user.id,
      ...paginateArray(roles, resolvePaginationParams(query)),
    };
  }

  async findPermissions(
    userId: string,
    query: FindUserPermissionsQueryDto = {},
    actor?: AuthenticatedActor,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PERMISSIONS_SELECT,
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    this.ensureActorCanAccessUserSchool(actor, user.schoolId);

    const permissionMap = new Map<
      string,
      {
        id: string;
        code: string;
        name: string;
        grantedByRoles: Array<{
          id: string;
          code: string;
          name: string;
        }>;
      }
    >();

    for (const assignment of user.roles) {
      const role = assignment.role;

      for (const entry of role.permissions) {
        const permission = entry.permission;
        const existing = permissionMap.get(permission.code);

        if (!existing) {
          permissionMap.set(permission.code, {
            id: permission.id,
            code: permission.code,
            name: permission.name,
            grantedByRoles: [
              {
                id: role.id,
                code: role.code,
                name: role.name,
              },
            ],
          });
          continue;
        }

        existing.grantedByRoles.push({
          id: role.id,
          code: role.code,
          name: role.name,
        });
      }
    }

    const sortBy = query.sortBy ?? 'code';
    const sortOrder = query.sortOrder ?? 'asc';
    let permissions = filterUserPermissions(
      Array.from(permissionMap.values()),
      query,
    );

    permissions.sort((left, right) =>
      this.compareValues(left[sortBy], right[sortBy], sortOrder),
    );

    return {
      userId: user.id,
      ...paginateArray(permissions, resolvePaginationParams(query)),
    };
  }

  private ensureContactProvided(email?: string, phone?: string): void {
    if (!email && !phone) {
      throw new BadRequestException({
        code: 'CONTACT_REQUIRED',
        message: 'Either email or phone must be provided',
      });
    }
  }

  private applySchoolScopeToUserQuery(
    query: FindUsersQueryDto,
    actor?: AuthenticatedActor,
  ): FindUsersQueryDto {
    const schoolId = this.resolveRequestedSchoolId(actor, query.schoolId);

    return {
      ...query,
      ...(schoolId ? { schoolId } : {}),
    };
  }

  private resolveRequestedSchoolId(
    actor?: AuthenticatedActor,
    requestedSchoolId?: string,
  ): string | undefined {
    if (!actor || this.isSuperAdmin(actor)) {
      return requestedSchoolId;
    }

    if (!actor.schoolId) {
      throw new ForbiddenException({
        code: 'TENANT_SCOPE_REQUIRED',
        message: 'Authenticated actor is not bound to a school scope',
      });
    }

    if (requestedSchoolId && requestedSchoolId !== actor.schoolId) {
      throw new ForbiddenException({
        code: 'TENANT_SCOPE_VIOLATION',
        message: 'You cannot access users outside your school scope',
      });
    }

    return actor.schoolId;
  }

  private ensureActorCanAccessUserSchool(
    actor: AuthenticatedActor | undefined,
    userSchoolId: string | null,
  ): void {
    if (!actor || this.isSuperAdmin(actor)) {
      return;
    }

    if (!actor.schoolId) {
      throw new ForbiddenException({
        code: 'TENANT_SCOPE_REQUIRED',
        message: 'Authenticated actor is not bound to a school scope',
      });
    }

    if (userSchoolId !== actor.schoolId) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }
  }

  private isSuperAdmin(actor: AuthenticatedActor): boolean {
    return actor.roles?.includes(Role.SUPER_ADMIN) ?? false;
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
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      if (error.code === 'P2003') {
        const fieldName =
          typeof error.meta?.field_name === 'string'
            ? error.meta.field_name
            : '';

        if (fieldName.includes('schoolId')) {
          throw new NotFoundException({
            code: 'INVALID_SCHOOL_ID',
            message: 'Invalid schoolId',
          });
        }

        throw new BadRequestException({
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'Invalid related resource reference',
        });
      }
    }

    throw error;
  }

  private async ensureSchoolExists(schoolId?: string): Promise<void> {
    if (!schoolId) {
      return;
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });

    if (!school) {
      throw new NotFoundException({
        code: 'INVALID_SCHOOL_ID',
        message: 'Invalid schoolId',
      });
    }
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
