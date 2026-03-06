import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('status')
  @ApiOperation({ summary: 'Roles module status endpoint' })
  getStatus(): string {
    return this.rolesService.getStatus();
  }
}
