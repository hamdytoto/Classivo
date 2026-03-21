import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '../enums/roles.enum';
import type { AuthenticatedActor } from '../types/request-context.type';

export function isSuperAdmin(actor?: AuthenticatedActor): boolean {
  return actor?.roles?.includes(Role.SUPER_ADMIN) ?? false;
}

export function resolveScopedSchoolId(
  actor: AuthenticatedActor | undefined,
  requestedSchoolId: string | undefined,
  resourceLabel: string,
): string | undefined {
  if (!actor || isSuperAdmin(actor)) {
    return requestedSchoolId;
  }

  if (!actor.schoolId) {
    throw new ForbiddenException({
      code: 'TENANT_SCOPE_REQUIRED',
      message: 'Authenticated actor is not bound to a school scope',
    });
  }

  if (requestedSchoolId && requestedSchoolId !== actor.schoolId) {
    throw new ForbiddenException({
      code: 'TENANT_SCOPE_VIOLATION',
      message: `You cannot access ${resourceLabel} outside your school scope`,
    });
  }

  return actor.schoolId;
}

export function assertActorCanAccessSchool(
  actor: AuthenticatedActor | undefined,
  schoolId: string | null,
  notFoundCode: string,
  notFoundMessage: string,
): void {
  if (!actor || isSuperAdmin(actor)) {
    return;
  }

  if (!actor.schoolId) {
    throw new ForbiddenException({
      code: 'TENANT_SCOPE_REQUIRED',
      message: 'Authenticated actor is not bound to a school scope',
    });
  }

  if (schoolId !== actor.schoolId) {
    throw new NotFoundException({
      code: notFoundCode,
      message: notFoundMessage,
    });
  }
}
