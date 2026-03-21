export const ROLE_SELECT = {
  id: true,
  code: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    select: {
      permission: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  },
} as const;

export const ROLE_USERS_SELECT = {
  id: true,
  code: true,
  name: true,
  users: {
    select: {
      assignedAt: true,
      user: {
        select: {
          id: true,
          schoolId: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      assignedAt: 'desc',
    },
  },
} as const;

export const PERMISSION_SELECT = {
  id: true,
  code: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;
