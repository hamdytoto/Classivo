import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, CurrentUserId, Roles } from '../../../common/decorators';
import { UuidParamDto } from '../../../common/dto/uuid-param.dto';
import {
  ApiAuthRequiredResponse,
  ApiRoleForbiddenResponse,
  ApiValidationFailureResponse,
} from '../../../common/swagger/api-error-responses';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { FindPermissionsQueryDto } from '../dto/find-permissions-query.dto';
import { FindRolesQueryDto } from '../dto/find-roles-query.dto';
import { FindRoleUsersQueryDto } from '../dto/find-role-users-query.dto';
import { RolePermissionParamsDto } from '../dto/role-permission-params.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UserRoleParamsDto } from '../dto/user-role-params.dto';
import { RolesService } from '../roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@ApiAuthRequiredResponse('/api/v1/roles')
@ApiRoleForbiddenResponse('/api/v1/roles')
@Roles('SUPER_ADMIN')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create role' })
  @ApiValidationFailureResponse('/api/v1/roles')
  createRole(@Body() dto: CreateRoleDto, @CurrentUserId() actorId: string) {
    return this.rolesService.createRole(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'List roles' })
  findAllRoles(@Query() query: FindRolesQueryDto) {
    return this.rolesService.findAllRoles(query);
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create permission' })
  @ApiValidationFailureResponse('/api/v1/roles/permissions')
  createPermission(
    @Body() dto: CreatePermissionDto,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.createPermission(dto, actorId);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List permissions' })
  findAllPermissions(@Query() query: FindPermissionsQueryDto) {
    return this.rolesService.findAllPermissions(query);
  }

  @Get('permissions/:id')
  @ApiOperation({ summary: 'Get permission by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiValidationFailureResponse('/api/v1/roles/permissions/{id}')
  findOnePermission(@Param() params: UuidParamDto) {
    return this.rolesService.findOnePermission(params.id);
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Update permission by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiValidationFailureResponse('/api/v1/roles/permissions/{id}')
  updatePermission(
    @Param() params: UuidParamDto,
    @Body() dto: UpdatePermissionDto,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.updatePermission(params.id, dto, actorId);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Inspect users assigned to a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiValidationFailureResponse('/api/v1/roles/{id}/users')
  findUsersForRole(
    @Param() params: UuidParamDto,
    @Query() query: FindRoleUsersQueryDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.rolesService.findUsersForRole(params.id, query, actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiValidationFailureResponse('/api/v1/roles/{id}')
  findOneRole(@Param() params: UuidParamDto) {
    return this.rolesService.findOneRole(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiValidationFailureResponse('/api/v1/roles/{id}')
  updateRole(
    @Param() params: UuidParamDto,
    @Body() dto: UpdateRoleDto,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.updateRole(params.id, dto, actorId);
  }

  @Post(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Assign permission to role' })
  @ApiValidationFailureResponse(
    '/api/v1/roles/{roleId}/permissions/{permissionId}',
  )
  assignPermissionToRole(
    @Param() params: RolePermissionParamsDto,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.assignPermissionToRole(
      params.roleId,
      params.permissionId,
      actorId,
    );
  }

  @Delete(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiValidationFailureResponse(
    '/api/v1/roles/{roleId}/permissions/{permissionId}',
  )
  removePermissionFromRole(
    @Param() params: RolePermissionParamsDto,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.removePermissionFromRole(
      params.roleId,
      params.permissionId,
      actorId,
    );
  }

  @Post('users/:userId/:roleId')
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiValidationFailureResponse('/api/v1/roles/users/{userId}/{roleId}')
  assignRoleToUser(
    @Param() params: UserRoleParamsDto,
    @CurrentUserId() actorId: string,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.rolesService.assignRoleToUser(
      params.userId,
      params.roleId,
      actorId,
      actor,
    );
  }

  @Delete('users/:userId/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiValidationFailureResponse('/api/v1/roles/users/{userId}/{roleId}')
  removeRoleFromUser(
    @Param() params: UserRoleParamsDto,
    @CurrentUserId() actorId: string,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.rolesService.removeRoleFromUser(
      params.userId,
      params.roleId,
      actorId,
      actor,
    );
  }
}
