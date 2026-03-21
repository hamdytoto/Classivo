import { Injectable } from '@nestjs/common';
import {
  buildPaginatedResult,
  resolvePaginationParams,
} from '../../../common/pagination/pagination.util';
import { FindPermissionsQueryDto } from '../dto/find-permissions-query.dto';
import { buildPermissionWhere } from '../filters/role-list.filter';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class FindPermissionsService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(query: FindPermissionsQueryDto = {}) {
    const pagination = resolvePaginationParams(query);
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const where = buildPermissionWhere(query);

    const [permissions, total] = await this.rolesRepository.runInTransaction([
      this.rolesRepository.findPermissions(
        where,
        pagination.skip,
        pagination.limit,
        {
          [sortBy]: sortOrder,
        },
      ),
      this.rolesRepository.countPermissions(where),
    ]);

    return buildPaginatedResult(permissions, pagination, total);
  }
}
