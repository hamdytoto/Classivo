import { Module } from '@nestjs/common';
import { UsersController } from './interface/users.controller';
import { UsersService } from './users.service';
import { usersProviders } from './users.providers';

@Module({
  controllers: [UsersController],
  providers: [
    ...usersProviders,
  ],
  exports: [UsersService],
})
export class UsersModule {}
