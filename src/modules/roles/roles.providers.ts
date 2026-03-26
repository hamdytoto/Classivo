import { AuditLogService } from '../../common/audit/audit-log.service';
import { PrismaTransactionService } from '../../common/prisma/prisma-transaction.service';
import { AssignPermissionToRoleService } from './application/assign-permission-to-role.service';
import { AssignRoleToUserService } from './application/assign-role-to-user.service';
import { CreatePermissionService } from './application/create-permission.service';
import { CreateRoleService } from './application/create-role.service';
import { FindPermissionService } from './application/find-permission.service';
import { FindPermissionsService } from './application/find-permissions.service';
import { FindRoleService } from './application/find-role.service';
import { FindRolesService } from './application/find-roles.service';
import { FindRoleUsersService } from './application/find-role-users.service';
import { RemovePermissionFromRoleService } from './application/remove-permission-from-role.service';
import { RemoveRoleFromUserService } from './application/remove-role-from-user.service';
import { UpdatePermissionService } from './application/update-permission.service';
import { UpdateRoleService } from './application/update-role.service';
import { RolesAccessPolicy } from './domain/policies/roles-access.policy';
import { RolesRepository } from './infrastructure/repositories/roles.repository';
import { RolesService } from './roles.service';

export const rolesApplicationProviders = [
  CreateRoleService,
  FindRolesService,
  FindRoleService,
  UpdateRoleService,
  CreatePermissionService,
  FindPermissionsService,
  FindPermissionService,
  UpdatePermissionService,
  FindRoleUsersService,
  AssignPermissionToRoleService,
  RemovePermissionFromRoleService,
  AssignRoleToUserService,
  RemoveRoleFromUserService,
];

export const rolesDomainProviders = [
  RolesAccessPolicy,
];

export const rolesInfrastructureProviders = [
  RolesRepository,
];

export const rolesCoreProviders = [
  RolesService,
  AuditLogService,
  PrismaTransactionService,
];

export const rolesProviders = [
  ...rolesCoreProviders,
  ...rolesApplicationProviders,
  ...rolesDomainProviders,
  ...rolesInfrastructureProviders,
];