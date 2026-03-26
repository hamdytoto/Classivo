import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { resolveListQuery } from '../../../common/query/list-query.util';
import { FindPermissionsQueryDto } from '../dto/find-permissions-query.dto';
import { buildPermissionWhere } from '../filters/role-list.filter';
import { RolesRepository } from '../infrastructure/repositories/roles.repository';

@Injectable()
export class FindPermissionsService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async execute(query: FindPermissionsQueryDto = {}) {
    const where = buildPermissionWhere(query);
    const { pagination, orderBy } = resolveListQuery<
      NonNullable<FindPermissionsQueryDto['sortBy']>,
      Prisma.PermissionOrderByWithRelationInput
    >(query, 'createdAt');

    return this.rolesRepository.findPermissionsPage(where, pagination, orderBy);
  }
}
