import { Injectable } from '@nestjs/common';
import type { AuthenticatedActor } from '../../common/types/request-context.type';
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
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { FindPermissionsQueryDto } from './dto/find-permissions-query.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { FindRoleUsersQueryDto } from './dto/find-role-users-query.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly createRoleService: CreateRoleService,
    private readonly findRolesService: FindRolesService,
    private readonly findRoleService: FindRoleService,
    private readonly updateRoleService: UpdateRoleService,
    private readonly createPermissionService: CreatePermissionService,
    private readonly findPermissionsService: FindPermissionsService,
    private readonly findPermissionService: FindPermissionService,
    private readonly updatePermissionService: UpdatePermissionService,
    private readonly findRoleUsersService: FindRoleUsersService,
    private readonly assignPermissionToRoleService: AssignPermissionToRoleService,
    private readonly removePermissionFromRoleService: RemovePermissionFromRoleService,
    private readonly assignRoleToUserService: AssignRoleToUserService,
    private readonly removeRoleFromUserService: RemoveRoleFromUserService,
  ) {}

  createRole(dto: CreateRoleDto, actorId?: string) {
    return this.createRoleService.execute(dto, actorId);
  }

  findAllRoles(query: FindRolesQueryDto = {}) {
    return this.findRolesService.execute(query);
  }

  findOneRole(id: string) {
    return this.findRoleService.execute(id);
  }

  updateRole(id: string, dto: UpdateRoleDto, actorId?: string) {
    return this.updateRoleService.execute(id, dto, actorId);
  }

  createPermission(dto: CreatePermissionDto, actorId?: string) {
    return this.createPermissionService.execute(dto, actorId);
  }

  findAllPermissions(query: FindPermissionsQueryDto = {}) {
    return this.findPermissionsService.execute(query);
  }

  findOnePermission(id: string) {
    return this.findPermissionService.execute(id);
  }

  updatePermission(id: string, dto: UpdatePermissionDto, actorId?: string) {
    return this.updatePermissionService.execute(id, dto, actorId);
  }

  findUsersForRole(
    roleId: string,
    query: FindRoleUsersQueryDto = {},
    actor?: AuthenticatedActor,
  ) {
    return this.findRoleUsersService.execute(roleId, query, actor);
  }

  assignPermissionToRole(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ) {
    return this.assignPermissionToRoleService.execute(
      roleId,
      permissionId,
      actorId,
    );
  }

  removePermissionFromRole(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ) {
    return this.removePermissionFromRoleService.execute(
      roleId,
      permissionId,
      actorId,
    );
  }

  assignRoleToUser(
    userId: string,
    roleId: string,
    actorId?: string,
    actor?: AuthenticatedActor,
  ) {
    return this.assignRoleToUserService.execute(userId, roleId, actorId, actor);
  }

  removeRoleFromUser(
    userId: string,
    roleId: string,
    actorId?: string,
    actor?: AuthenticatedActor,
  ) {
    return this.removeRoleFromUserService.execute(
      userId,
      roleId,
      actorId,
      actor,
    );
  }
}
