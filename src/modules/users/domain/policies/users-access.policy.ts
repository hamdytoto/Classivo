import { BadRequestException, Injectable } from '@nestjs/common';
import {
  assertActorCanAccessSchool,
  resolveScopedSchoolId,
} from '../../../../common/authorization/tenant-access.util';
import type { AuthenticatedActor } from '../../../../common/types/request-context.type';
import { FindUsersQueryDto } from '../../dto/find-users-query.dto';

@Injectable()
export class UsersAccessPolicy {
  ensureContactProvided(email?: string, phone?: string): void {
    if (!email && !phone) {
      throw new BadRequestException({
        code: 'CONTACT_REQUIRED',
        message: 'Either email or phone must be provided',
      });
    }
  }

  applySchoolScopeToUsersQuery(
    query: FindUsersQueryDto,
    actor?: AuthenticatedActor,
  ): FindUsersQueryDto {
    const schoolId = resolveScopedSchoolId(actor, query.schoolId, 'users');

    return {
      ...query,
      ...(schoolId ? { schoolId } : {}),
    };
  }

  resolveSchoolId(
    actor?: AuthenticatedActor,
    requestedSchoolId?: string,
  ): string | undefined {
    return resolveScopedSchoolId(actor, requestedSchoolId, 'users');
  }

  assertActorCanAccessUser(
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
