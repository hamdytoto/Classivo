export const USER_PUBLIC_SELECT = {
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
} as const;

export const USER_ROLES_SELECT = {
  id: true,
  schoolId: true,
  roles: {
    select: {
      assignedAt: true,
      role: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      assignedAt: 'desc',
    },
  },
} as const;

export const USER_PERMISSIONS_SELECT = {
  id: true,
  schoolId: true,
  roles: {
    select: {
      role: {
        select: {
          id: true,
          code: true,
          name: true,
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
        },
      },
    },
  },
} as const;
