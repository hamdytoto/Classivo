import { Injectable } from '@nestjs/common';
import {
  buildPaginatedResult,
  resolvePaginationParams,
} from '../../../common/pagination/pagination.util';
import { FindRolesQueryDto } from '../dto/find-roles-query.dto';
import { buildRoleWhere } from '../filters/role-list.filter';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class FindRolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(query: FindRolesQueryDto = {}) {
    const pagination = resolvePaginationParams(query);
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = buildRoleWhere(query);

    const [roles, total] = await this.rolesRepository.runInTransaction([
      this.rolesRepository.findRoles(where, pagination.skip, pagination.limit, {
        [sortBy]: sortOrder,
      }),
      this.rolesRepository.countRoles(where),
    ]);

    return buildPaginatedResult(roles, pagination, total);
  }
}
