import { Module } from '@nestjs/common';
import { RolesController } from './interface/roles.controller';
import { RolesService } from './roles.service';
import { rolesProviders } from './roles.providers';

@Module({
  controllers: [RolesController],
  providers: [
   ...rolesProviders
  ],
  exports: [RolesService],
})
export class RolesModule {}
