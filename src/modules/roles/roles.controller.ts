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
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { FindPermissionsQueryDto } from './dto/find-permissions-query.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { FindRoleUsersQueryDto } from './dto/find-role-users-query.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
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
  findOnePermission(@Param('id') id: string) {
    return this.rolesService.findOnePermission(id);
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Update permission by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.rolesService.updatePermission(id, dto);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Inspect users assigned to a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findUsersForRole(
    @Param('id') id: string,
    @Query() query: FindRoleUsersQueryDto,
  ) {
    return this.rolesService.findUsersForRole(id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOneRole(@Param('id') id: string) {
    return this.rolesService.findOneRole(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Post(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Assign permission to role' })
  assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.assignPermissionToRole(
      roleId,
      permissionId,
      actorId,
    );
  }

  @Delete(':roleId/permissions/:permissionId')
  @ApiOperation({ summary: 'Remove permission from role' })
  removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.removePermissionFromRole(
      roleId,
      permissionId,
      actorId,
    );
  }

  @Post('users/:userId/:roleId')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRoleToUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.assignRoleToUser(userId, roleId, actorId);
  }

  @Delete('users/:userId/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  removeRoleFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @CurrentUserId() actorId: string,
  ) {
    return this.rolesService.removeRoleFromUser(userId, roleId, actorId);
  }
}
