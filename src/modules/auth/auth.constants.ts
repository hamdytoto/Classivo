export const AUTH_USER_SELECT = {
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

export const AUTH_ME_SELECT = {
  ...AUTH_USER_SELECT,
  roles: {
    select: {
      role: {
        select: {
          code: true,
          permissions: {
            select: {
              permission: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const SCHOOL_PUBLIC_SELECT = {
  id: true,
  name: true,
  code: true,
  createdAt: true,
  updatedAt: true,
} as const;
