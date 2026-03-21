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
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Permissions } from '../../common/decorators';
import { UuidParamDto } from '../../common/dto/uuid-param.dto';
import { JwtAuthGuard } from '../../common/guards';
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
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('users.manage')
  @ApiOperation({ summary: 'Create user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Permissions('users.read')
  @ApiOperation({ summary: 'Find/list users' })
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
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
  findOne(@Param() params: UuidParamDto) {
    return this.usersService.findOne(params.id);
  }

  @Patch(':id')
  @Permissions('users.manage')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(@Param() params: UuidParamDto, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(params.id, updateUserDto);
  }
}
