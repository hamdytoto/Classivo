import { randomUUID } from 'crypto';

type UserRecord = {
  id: string;
  schoolId: string | null;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RoleRecord = {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type PermissionRecord = {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserRoleRecord = {
  userId: string;
  roleId: string;
  assignedAt: Date;
};

type RolePermissionRecord = {
  roleId: string;
  permissionId: string;
  createdAt: Date;
};

type SessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AuditLogRecord = {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  actorId: string | null;
  schoolId: string | null;
  ipAddress: string | null;
  metadata?: unknown;
};

type SchoolRecord = {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InMemoryPrismaSeed = {
  users?: UserRecord[];
  roles?: RoleRecord[];
  permissions?: PermissionRecord[];
  userRoles?: UserRoleRecord[];
  rolePermissions?: RolePermissionRecord[];
  sessions?: SessionRecord[];
  auditLogs?: AuditLogRecord[];
  schools?: SchoolRecord[];
};

export class InMemoryPrismaService {
  private readonly users: UserRecord[];
  private readonly roles: RoleRecord[];
  private readonly permissions: PermissionRecord[];
  private readonly userRoles: UserRoleRecord[];
  private readonly rolePermissions: RolePermissionRecord[];
  private readonly sessions: SessionRecord[];
  private readonly auditLogs: AuditLogRecord[];
  private readonly schools: SchoolRecord[];

  constructor(seed: InMemoryPrismaSeed = {}) {
    this.users = [...(seed.users ?? [])];
    this.roles = [...(seed.roles ?? [])];
    this.permissions = [...(seed.permissions ?? [])];
    this.userRoles = [...(seed.userRoles ?? [])];
    this.rolePermissions = [...(seed.rolePermissions ?? [])];
    this.sessions = [...(seed.sessions ?? [])];
    this.auditLogs = [...(seed.auditLogs ?? [])];
    this.schools = [...(seed.schools ?? [])];
  }

  readonly user = {
    findUnique: async ({ where, select }: any) => {
      const user = this.users.find((candidate) => {
        if (where.id) {
          return candidate.id === where.id;
        }
        if (where.email) {
          return candidate.email === where.email;
        }
        if (where.phone) {
          return candidate.phone === where.phone;
        }
        return false;
      });

      return user ? this.selectUser(user, select) : null;
    },
    update: async ({ where, data, select }: any) => {
      const user = this.users.find((candidate) => candidate.id === where.id);

      if (!user) {
        throw new Error(`User ${where.id} not found`);
      }

      Object.assign(user, data, {
        updatedAt: data.updatedAt ?? new Date(),
      });

      return this.selectUser(user, select);
    },
  };

  readonly role = {
    findUnique: async ({ where, select }: any) => {
      const role = this.roles.find((candidate) => candidate.id === where.id);
      return role ? this.selectRole(role, select) : null;
    },
  };

  readonly permission = {
    findUnique: async ({ where, select }: any) => {
      const permission = this.permissions.find(
        (candidate) => candidate.id === where.id,
      );
      return permission ? this.selectPermission(permission, select) : null;
    },
  };

  readonly userRole = {
    findMany: async ({ where, select }: any) => {
      return this.userRoles
        .filter((assignment) =>
          where?.userId ? assignment.userId === where.userId : true,
        )
        .map((assignment) => {
          const result: Record<string, unknown> = {};

          if (select?.assignedAt) {
            result.assignedAt = assignment.assignedAt;
          }

          if (select?.role) {
            const role = this.mustFindRole(assignment.roleId);
            result.role = this.selectRole(role, select.role.select);
          }

          if (select?.user) {
            const user = this.mustFindUser(assignment.userId);
            result.user = this.selectUser(user, select.user.select);
          }

          return result;
        });
    },
    findUnique: async ({ where, select }: any) => {
      const assignment = this.userRoles.find(
        (candidate) =>
          candidate.userId === where.userId_roleId.userId &&
          candidate.roleId === where.userId_roleId.roleId,
      );

      if (!assignment) {
        return null;
      }

      const result: Record<string, unknown> = {};

      if (select?.userId) {
        result.userId = assignment.userId;
      }

      if (select?.roleId) {
        result.roleId = assignment.roleId;
      }

      return result;
    },
    upsert: async ({ where, create }: any) => {
      const existing = this.userRoles.find(
        (candidate) =>
          candidate.userId === where.userId_roleId.userId &&
          candidate.roleId === where.userId_roleId.roleId,
      );

      if (existing) {
        return existing;
      }

      const assignment: UserRoleRecord = {
        userId: create.userId,
        roleId: create.roleId,
        assignedAt: new Date(),
      };

      this.userRoles.push(assignment);
      return assignment;
    },
    delete: async ({ where }: any) => {
      const index = this.userRoles.findIndex(
        (candidate) =>
          candidate.userId === where.userId_roleId.userId &&
          candidate.roleId === where.userId_roleId.roleId,
      );

      if (index === -1) {
        throw new Error('User-role assignment not found');
      }

      const [deleted] = this.userRoles.splice(index, 1);
      return deleted;
    },
  };

  readonly rolePermission = {
    findUnique: async ({ where, select }: any) => {
      const assignment = this.rolePermissions.find(
        (candidate) =>
          candidate.roleId === where.roleId_permissionId.roleId &&
          candidate.permissionId === where.roleId_permissionId.permissionId,
      );

      if (!assignment) {
        return null;
      }

      const result: Record<string, unknown> = {};

      if (select?.roleId) {
        result.roleId = assignment.roleId;
      }

      if (select?.permissionId) {
        result.permissionId = assignment.permissionId;
      }

      return result;
    },
    upsert: async ({ where, create }: any) => {
      const existing = this.rolePermissions.find(
        (candidate) =>
          candidate.roleId === where.roleId_permissionId.roleId &&
          candidate.permissionId === where.roleId_permissionId.permissionId,
      );

      if (existing) {
        return existing;
      }

      const assignment: RolePermissionRecord = {
        roleId: create.roleId,
        permissionId: create.permissionId,
        createdAt: new Date(),
      };

      this.rolePermissions.push(assignment);
      return assignment;
    },
    delete: async ({ where }: any) => {
      const index = this.rolePermissions.findIndex(
        (candidate) =>
          candidate.roleId === where.roleId_permissionId.roleId &&
          candidate.permissionId === where.roleId_permissionId.permissionId,
      );

      if (index === -1) {
        throw new Error('Role-permission assignment not found');
      }

      const [deleted] = this.rolePermissions.splice(index, 1);
      return deleted;
    },
  };

  readonly session = {
    create: async ({ data }: any) => {
      const session: SessionRecord = {
        id: data.id,
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        lastUsedAt: data.lastUsedAt,
        expiresAt: data.expiresAt,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.sessions.push(session);
      return { ...session };
    },
    findUnique: async ({ where, select }: any) => {
      const session = this.sessions.find(
        (candidate) => candidate.id === where.id,
      );
      return session ? this.selectSession(session, select) : null;
    },
    update: async ({ where, data }: any) => {
      const session = this.sessions.find(
        (candidate) => candidate.id === where.id,
      );

      if (!session) {
        throw new Error(`Session ${where.id} not found`);
      }

      Object.assign(session, data, {
        updatedAt: new Date(),
      });

      return { ...session };
    },
    updateMany: async ({ where, data }: any) => {
      const matches = this.sessions.filter((session) => {
        const matchesId = where.id ? session.id === where.id : true;
        const matchesUserId = where.userId
          ? session.userId === where.userId
          : true;
        const matchesRevokedAt =
          where.revokedAt === null ? session.revokedAt === null : true;
        const matchesNot = where.NOT?.id ? session.id !== where.NOT.id : true;

        return matchesId && matchesUserId && matchesRevokedAt && matchesNot;
      });

      matches.forEach((session) => {
        Object.assign(session, data, {
          updatedAt: new Date(),
        });
      });

      return { count: matches.length };
    },
  };

  readonly auditLog = {
    create: async ({ data }: any) => {
      const record: AuditLogRecord = {
        id: randomUUID(),
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        actorId: data.actorId ?? null,
        schoolId: data.schoolId ?? null,
        ipAddress: data.ipAddress ?? null,
        metadata: data.metadata,
      };

      this.auditLogs.push(record);
      return record;
    },
  };

  readonly school = {
    findUnique: async ({ where, select }: any) => {
      const school = this.schools.find(
        (candidate) => candidate.id === where.id,
      );

      if (!school) {
        return null;
      }

      return this.pickFields(school, select);
    },
  };

  async $transaction(input: any): Promise<any> {
    if (Array.isArray(input)) {
      return Promise.all(input);
    }

    if (typeof input === 'function') {
      return input(this);
    }

    throw new Error('Unsupported transaction input');
  }

  private selectUser(user: UserRecord, select: Record<string, any>) {
    if (!select) {
      return { ...user };
    }

    const result = this.pickFields(user, select);

    if (select.roles) {
      const assignments = this.userRoles
        .filter((assignment) => assignment.userId === user.id)
        .sort(
          (left, right) =>
            right.assignedAt.getTime() - left.assignedAt.getTime(),
        )
        .map((assignment) => {
          const entry: Record<string, unknown> = {};

          if (select.roles.select?.assignedAt) {
            entry.assignedAt = assignment.assignedAt;
          }

          if (select.roles.select?.role) {
            entry.role = this.selectRole(
              this.mustFindRole(assignment.roleId),
              select.roles.select.role.select,
            );
          }

          return entry;
        });

      result.roles = assignments;
    }

    return result;
  }

  private selectRole(role: RoleRecord, select: Record<string, any>) {
    if (!select) {
      return { ...role };
    }

    const result = this.pickFields(role, select);

    if (select.permissions) {
      result.permissions = this.rolePermissions
        .filter((assignment) => assignment.roleId === role.id)
        .map((assignment) => ({
          permission: this.selectPermission(
            this.mustFindPermission(assignment.permissionId),
            select.permissions.select.permission.select,
          ),
        }));
    }

    if (select.users) {
      result.users = this.userRoles
        .filter((assignment) => assignment.roleId === role.id)
        .sort(
          (left, right) =>
            right.assignedAt.getTime() - left.assignedAt.getTime(),
        )
        .map((assignment) => ({
          assignedAt: assignment.assignedAt,
          user: this.selectUser(
            this.mustFindUser(assignment.userId),
            select.users.select.user.select,
          ),
        }));
    }

    return result;
  }

  private selectPermission(
    permission: PermissionRecord,
    select: Record<string, any>,
  ) {
    return select ? this.pickFields(permission, select) : { ...permission };
  }

  private selectSession(session: SessionRecord, select: Record<string, any>) {
    if (!select) {
      return { ...session };
    }

    const result = this.pickFields(session, select);

    if (select.user) {
      result.user = this.selectUser(
        this.mustFindUser(session.userId),
        select.user.select,
      );
    }

    return result;
  }

  private pickFields(
    record: Record<string, unknown>,
    select?: Record<string, any>,
  ) {
    if (!select) {
      return { ...record };
    }

    const result: Record<string, unknown> = {};

    for (const [field, enabled] of Object.entries(select)) {
      if (enabled === true) {
        result[field] = record[field];
      }
    }

    return result;
  }

  private mustFindUser(userId: string) {
    const user = this.users.find((candidate) => candidate.id === userId);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    return user;
  }

  private mustFindRole(roleId: string) {
    const role = this.roles.find((candidate) => candidate.id === roleId);

    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    return role;
  }

  private mustFindPermission(permissionId: string) {
    const permission = this.permissions.find(
      (candidate) => candidate.id === permissionId,
    );

    if (!permission) {
      throw new Error(`Permission ${permissionId} not found`);
    }

    return permission;
  }
}
