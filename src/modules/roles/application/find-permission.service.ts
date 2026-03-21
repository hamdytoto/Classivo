import { Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class FindPermissionService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(id: string) {
    const permission = await this.rolesRepository.findPermissionById(id);

    if (!permission) {
      throw new NotFoundException({
        code: 'PERMISSION_NOT_FOUND',
        message: 'Permission not found',
      });
    }

    return permission;
  }
}
