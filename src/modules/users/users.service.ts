import { Injectable } from '@nestjs/common';
import type { AuthenticatedActor } from '../../common/types/request-context.type';
import { CreateUserService } from './application/create-user.service';
import { FindUserPermissionsService } from './application/find-user-permissions.service';
import { FindUserRolesService } from './application/find-user-roles.service';
import { FindUserService } from './application/find-user.service';
import { FindUsersService } from './application/find-users.service';
import { GetCurrentUserProfileService } from './application/get-current-user-profile.service';
import { UpdateUserService } from './application/update-user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserPermissionsQueryDto } from './dto/find-user-permissions-query.dto';
import { FindUserRolesQueryDto } from './dto/find-user-roles-query.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly createUserService: CreateUserService,
    private readonly findUsersService: FindUsersService,
    private readonly findUserService: FindUserService,
    private readonly updateUserService: UpdateUserService,
    private readonly getCurrentUserProfileService: GetCurrentUserProfileService,
    private readonly findUserRolesService: FindUserRolesService,
    private readonly findUserPermissionsService: FindUserPermissionsService,
  ) {}

  create(createUserDto: CreateUserDto, actor?: AuthenticatedActor) {
    return this.createUserService.execute(createUserDto, actor);
  }

  findAll(query: FindUsersQueryDto = {}, actor?: AuthenticatedActor) {
    return this.findUsersService.execute(query, actor);
  }

  findOne(id: string, actor?: AuthenticatedActor) {
    return this.findUserService.execute(id, actor);
  }

  update(id: string, updateUserDto: UpdateUserDto, actor?: AuthenticatedActor) {
    return this.updateUserService.execute(id, updateUserDto, actor);
  }

  me(userId: string) {
    return this.getCurrentUserProfileService.execute(userId);
  }

  findRoles(
    userId: string,
    query: FindUserRolesQueryDto = {},
    actor?: AuthenticatedActor,
  ) {
    return this.findUserRolesService.execute(userId, query, actor);
  }

  findPermissions(
    userId: string,
    query: FindUserPermissionsQueryDto = {},
    actor?: AuthenticatedActor,
  ) {
    return this.findUserPermissionsService.execute(userId, query, actor);
  }
}
