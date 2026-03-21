import { Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class FindRoleService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(id: string) {
    const role = await this.rolesRepository.findRoleById(id);

    if (!role) {
      throw new NotFoundException({
        code: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    return role;
  }
}
