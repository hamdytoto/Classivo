import {
  Body,
  Controller,
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
import { CurrentUser, CurrentUserId, Permissions } from '../../../common/decorators';
import { UuidParamDto } from '../../../common/dto/uuid-param.dto';
import {
  ApiAuthRequiredResponse,
  ApiPermissionForbiddenResponse,
  ApiValidationFailureResponse,
} from '../../../common/swagger/api-error-responses';
import type { AuthenticatedActor } from '../../../common/types/request-context.type';
import { CreateUserDto } from '../dto/create-user.dto';
import { FindUserPermissionsQueryDto } from '../dto/find-user-permissions-query.dto';
import { FindUserRolesQueryDto } from '../dto/find-user-roles-query.dto';
import { FindUsersQueryDto } from '../dto/find-users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersService } from '../users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users.manage')
  @ApiOperation({ summary: 'Create user' })
  @ApiAuthRequiredResponse('/api/v1/users')
  @ApiPermissionForbiddenResponse('/api/v1/users')
  @ApiValidationFailureResponse('/api/v1/users')
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.usersService.create(createUserDto, actor);
  }

  @Get()
  @Permissions('users.read')
  @ApiOperation({ summary: 'Find/list users' })
  @ApiAuthRequiredResponse('/api/v1/users')
  @ApiPermissionForbiddenResponse('/api/v1/users')
  @ApiValidationFailureResponse('/api/v1/users')
  findAll(
    @Query() query: FindUsersQueryDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.usersService.findAll(query, actor);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiAuthRequiredResponse('/api/v1/users/me')
  me(@CurrentUserId() userId: string) {
    return this.usersService.me(userId);
  }

  @Get(':id/roles')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Inspect roles assigned to a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiAuthRequiredResponse('/api/v1/users/{id}/roles')
  @ApiPermissionForbiddenResponse('/api/v1/users/{id}/roles')
  @ApiValidationFailureResponse('/api/v1/users/{id}/roles')
  findRoles(
    @Param() params: UuidParamDto,
    @Query() query: FindUserRolesQueryDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.usersService.findRoles(params.id, query, actor);
  }

  @Get(':id/permissions')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Inspect effective permissions for a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiAuthRequiredResponse('/api/v1/users/{id}/permissions')
  @ApiPermissionForbiddenResponse('/api/v1/users/{id}/permissions')
  @ApiValidationFailureResponse('/api/v1/users/{id}/permissions')
  findPermissions(
    @Param() params: UuidParamDto,
    @Query() query: FindUserPermissionsQueryDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.usersService.findPermissions(params.id, query, actor);
  }

  @Get(':id')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Find user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiAuthRequiredResponse('/api/v1/users/{id}')
  @ApiPermissionForbiddenResponse('/api/v1/users/{id}')
  @ApiValidationFailureResponse('/api/v1/users/{id}')
  findOne(
    @Param() params: UuidParamDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.usersService.findOne(params.id, actor);
  }

  @Patch(':id')
  @Permissions('users.manage')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiAuthRequiredResponse('/api/v1/users/{id}')
  @ApiPermissionForbiddenResponse('/api/v1/users/{id}')
  @ApiValidationFailureResponse('/api/v1/users/{id}')
  update(
    @Param() params: UuidParamDto,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.usersService.update(params.id, updateUserDto, actor);
  }
}
