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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUserId, Roles } from '../../common/decorators';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { FindPermissionsQueryDto } from './dto/find-permissions-query.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { FindRoleUsersQueryDto } from './dto/find-role-users-query.dto';
import { RolePermissionParamsDto } from './dto/role-permission-params.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UserRoleParamsDto } from './dto/user-role-params.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Roles('SUPER_ADMIN')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create role' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List roles' })
  findAllRoles(@Query() query: FindRolesQueryDto) {
    return this.rolesService.findAllRoles(query);
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create permission' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.rolesService.createPermission(dto);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List permissions' })
  findAllPermissions(@Query() query: FindPermissionsQueryDto) {
    return this.rolesService.findAllPermissions(query);
  }

  @Get('permissions/:id')
  @ApiOperation({ summary: 'Get permission by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOnePermission(@Param() params: UuidParamDto) {
    return this.rolesService.findOnePermission(params.id);
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Update permission by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updatePermission(
    @Param() params: UuidParamDto,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.rolesService.updatePermission(params.id, dto);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Inspect users assigned to a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findUsersForRole(
    @Param() params: UuidParamDto,
    @Query() query: FindRoleUsersQueryDto,
  ) {
    return this.rolesService.findUsersForRole(params.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOneRole(@Param() params: UuidParamDto) {
    return this.rolesService.findOneRole(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateRole(@Param() params: UuidParamDto, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(params.id, dto);
  }

  @Post(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Assign permission to role' })
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
  assignRoleToUser(
    @Param() params: UserRoleParamsDto,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.assignRoleToUser(
      params.userId,
      params.roleId,
      actorId,
    );
  }

  @Delete('users/:userId/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  removeRoleFromUser(
    @Param() params: UserRoleParamsDto,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.removeRoleFromUser(
      params.userId,
      params.roleId,
      actorId,
    );
  }
}
