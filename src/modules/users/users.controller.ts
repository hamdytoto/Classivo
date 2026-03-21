import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Permissions } from '../../common/decorators';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { JwtAuthGuard } from '../../common/guards';
import {
  ApiAuthRequiredResponse,
  ApiPermissionForbiddenResponse,
  ApiValidationFailureResponse,
} from '../../common/swagger/api-error-responses';
import type { AuthenticatedActor } from '../../common/types/request-context.type';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserPermissionsQueryDto } from './dto/find-user-permissions-query.dto';
import { FindUserRolesQueryDto } from './dto/find-user-roles-query.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

type RequestWithActor = Request & {
  user?: AuthenticatedActor;
};

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users.manage')
  @ApiOperation({ summary: 'Create user' })
  @ApiAuthRequiredResponse('/api/v1/users')
  @ApiPermissionForbiddenResponse('/api/v1/users')
  @ApiValidationFailureResponse('/api/v1/users')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions('users.read')
  @ApiOperation({ summary: 'Find/list users' })
  @ApiAuthRequiredResponse('/api/v1/users')
  @ApiPermissionForbiddenResponse('/api/v1/users')
  @ApiValidationFailureResponse('/api/v1/users')
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiAuthRequiredResponse('/api/v1/users/me')
  me(@Req() request: RequestWithActor) {
    const actor = request.user;
    const userId = actor?.id ?? actor?.userId ?? actor?.sub;

    if (!userId) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message:
          'Authenticated user is required. Provide a valid access token.',
      });
    }

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
  ) {
    return this.usersService.findRoles(params.id, query);
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
  ) {
    return this.usersService.findPermissions(params.id, query);
  }

  @Get(':id')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Find user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiAuthRequiredResponse('/api/v1/users/{id}')
  @ApiPermissionForbiddenResponse('/api/v1/users/{id}')
  @ApiValidationFailureResponse('/api/v1/users/{id}')
  findOne(@Param() params: UuidParamDto) {
    return this.usersService.findOne(params.id);
  }

  @Patch(':id')
  @Permissions('users.manage')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiAuthRequiredResponse('/api/v1/users/{id}')
  @ApiPermissionForbiddenResponse('/api/v1/users/{id}')
  @ApiValidationFailureResponse('/api/v1/users/{id}')
  update(@Param() params: UuidParamDto, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(params.id, updateUserDto);
  }
}
