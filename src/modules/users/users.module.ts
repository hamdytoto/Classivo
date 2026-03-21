import { Module } from '@nestjs/common';
import { CreateUserService } from './application/create-user.service';
import { FindUserPermissionsService } from './application/find-user-permissions.service';
import { FindUserRolesService } from './application/find-user-roles.service';
import { FindUserService } from './application/find-user.service';
import { FindUsersService } from './application/find-users.service';
import { GetCurrentUserProfileService } from './application/get-current-user-profile.service';
import { UpdateUserService } from './application/update-user.service';
import { UsersAccessPolicy } from './domain/policies/users-access.policy';
import { UsersRepository } from './infrastructure/repositories/users.repository';
import { UsersController } from './interface/users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    CreateUserService,
    FindUsersService,
    FindUserService,
    UpdateUserService,
    GetCurrentUserProfileService,
    FindUserRolesService,
    FindUserPermissionsService,
    UsersAccessPolicy,
    UsersRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}
