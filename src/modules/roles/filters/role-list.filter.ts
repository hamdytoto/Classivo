import { Prisma, UserStatus } from '@prisma/client';
import { FindPermissionsQueryDto } from '../dto/find-permissions-query.dto';
import { FindRolesQueryDto } from '../dto/find-roles-query.dto';
import { FindRoleUsersQueryDto } from '../dto/find-role-users-query.dto';

type RoleUserListItem = {
  schoolId: string | null;
  status: UserStatus;
  email: string | null;
  firstName: string;
  lastName: string;
};

export function buildRoleWhere(query: FindRolesQueryDto): Prisma.RoleWhereInput {
  const where: Prisma.RoleWhereInput = {};

  if (query.code) {
    where.code = {
      contains: query.code,
      mode: 'insensitive',
    };
  }

  if (query.name) {
    where.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  return where;
}

export function buildPermissionWhere(
  query: FindPermissionsQueryDto,
): Prisma.PermissionWhereInput {
  const where: Prisma.PermissionWhereInput = {};

  if (query.code) {
    where.code = {
      contains: query.code,
      mode: 'insensitive',
    };
  }

  if (query.name) {
    where.name = {
      contains: query.name,
      mode: 'insensitive',
    };
  }

  return where;
}

export function filterRoleUsers<T extends RoleUserListItem>(
  users: T[],
  query: FindRoleUsersQueryDto,
): T[] {
  let filteredUsers = users;

  if (query.schoolId) {
    filteredUsers = filteredUsers.filter(
      (user) => user.schoolId === query.schoolId,
    );
  }

  if (query.status) {
    filteredUsers = filteredUsers.filter((user) => user.status === query.status);
  }

  if (query.email) {
    const emailFilter = query.email.toLowerCase();
    filteredUsers = filteredUsers.filter((user) =>
      (user.email ?? '').toLowerCase().includes(emailFilter),
    );
  }

  if (query.firstName) {
    const firstNameFilter = query.firstName.toLowerCase();
    filteredUsers = filteredUsers.filter((user) =>
      user.firstName.toLowerCase().includes(firstNameFilter),
    );
  }

  if (query.lastName) {
    const lastNameFilter = query.lastName.toLowerCase();
    filteredUsers = filteredUsers.filter((user) =>
      user.lastName.toLowerCase().includes(lastNameFilter),
    );
  }

  return filteredUsers;
}
