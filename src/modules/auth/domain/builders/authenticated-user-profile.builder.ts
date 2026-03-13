import { Injectable } from '@nestjs/common';
import {
  AuthenticatedUserProfile,
  AuthenticatedUserProfileSource,
} from '../auth.types';

@Injectable()
export class AuthenticatedUserProfileBuilder {
  build(user: AuthenticatedUserProfileSource): AuthenticatedUserProfile {
    const roles = user.roles.map((assignment) => assignment.role.code);
    const permissions = [
      ...new Set(
        user.roles.flatMap((assignment) =>
          assignment.role.permissions.map((entry) => entry.permission.code),
        ),
      ),
    ];

    return {
      id: user.id,
      schoolId: user.schoolId,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
      permissions,
    };
  }
}
