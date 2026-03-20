import { Prisma } from '@prisma/client';
import { FindUserPermissionsQueryDto } from '../dto/find-user-permissions-query.dto';
import { FindUserRolesQueryDto } from '../dto/find-user-roles-query.dto';
import { FindUsersQueryDto } from '../dto/find-users-query.dto';

type UserRoleListItem = {
  code: string;
  name: string;
};

type UserPermissionListItem = {
  code: string;
  name: string;
};

export function buildUserWhere(query: FindUsersQueryDto): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (query.schoolId) {
    where.schoolId = query.schoolId;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.email) {
    where.email = {
      contains: query.email,
      mode: 'insensitive',
    };
  }

  if (query.phone) {
    where.phone = {
      contains: query.phone,
    };
  }

  return where;
}

export function filterUserRoles<T extends UserRoleListItem>(
  roles: T[],
  query: FindUserRolesQueryDto,
): T[] {
  let filteredRoles = roles;

  if (query.code) {
    const codeFilter = query.code.toLowerCase();
    filteredRoles = filteredRoles.filter((role) =>
      role.code.toLowerCase().includes(codeFilter),
    );
  }

  if (query.name) {
    const nameFilter = query.name.toLowerCase();
    filteredRoles = filteredRoles.filter((role) =>
      role.name.toLowerCase().includes(nameFilter),
    );
  }

  return filteredRoles;
}

export function filterUserPermissions<T extends UserPermissionListItem>(
  permissions: T[],
  query: FindUserPermissionsQueryDto,
): T[] {
  let filteredPermissions = permissions;

  if (query.code) {
    const codeFilter = query.code.toLowerCase();
    filteredPermissions = filteredPermissions.filter((permission) =>
      permission.code.toLowerCase().includes(codeFilter),
    );
  }

  if (query.name) {
    const nameFilter = query.name.toLowerCase();
    filteredPermissions = filteredPermissions.filter((permission) =>
      permission.name.toLowerCase().includes(nameFilter),
    );
  }

  return filteredPermissions;
}
