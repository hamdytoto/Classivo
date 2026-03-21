import { Injectable } from '@nestjs/common';
import {
  assertActorCanAccessSchool,
  resolveScopedSchoolId,
} from '../../../../common/authorization/tenant-access.util';
import type { AuthenticatedActor } from '../../../../common/types/request-context.type';
import { FindRoleUsersQueryDto } from '../../dto/find-role-users-query.dto';

@Injectable()
export class RolesAccessPolicy {
  applySchoolScopeToRoleUsersQuery(
    query: FindRoleUsersQueryDto,
    actor?: AuthenticatedActor,
  ): FindRoleUsersQueryDto {
    const schoolId = resolveScopedSchoolId(actor, query.schoolId, 'role users');

    return {
      ...query,
      ...(schoolId ? { schoolId } : {}),
    };
  }

  assertActorCanAccessUserSchool(
    actor: AuthenticatedActor | undefined,
    schoolId: string | null,
  ): void {
    assertActorCanAccessSchool(
      actor,
      schoolId,
      'USER_NOT_FOUND',
      'User not found',
    );
  }
}
