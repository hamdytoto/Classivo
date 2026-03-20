import {
  buildPermissionWhere,
  buildRoleWhere,
  filterRoleUsers,
} from './role-list.filter';

describe('role-list.filter', () => {
  it('should build Prisma where filters for role listings', () => {
    expect(buildRoleWhere({ code: 'ADMIN', name: 'Admin' })).toEqual({
      code: {
        contains: 'ADMIN',
        mode: 'insensitive',
      },
      name: {
        contains: 'Admin',
        mode: 'insensitive',
      },
    });
  });

  it('should build Prisma where filters for permission listings', () => {
    expect(buildPermissionWhere({ code: 'users', name: 'Users' })).toEqual({
      code: {
        contains: 'users',
        mode: 'insensitive',
      },
      name: {
        contains: 'Users',
        mode: 'insensitive',
      },
    });
  });

  it('should filter role users by school, status, and text fields', () => {
    expect(
      filterRoleUsers(
        [
          {
            schoolId: 'school-1',
            status: 'ACTIVE',
            email: 'admin@classivo.dev',
            firstName: 'Admin',
            lastName: 'User',
          },
          {
            schoolId: 'school-2',
            status: 'SUSPENDED',
            email: 'teacher@classivo.dev',
            firstName: 'Teacher',
            lastName: 'User',
          },
        ],
        {
          schoolId: 'school-1',
          status: 'ACTIVE',
          email: 'admin',
        },
      ),
    ).toEqual([
      {
        schoolId: 'school-1',
        status: 'ACTIVE',
        email: 'admin@classivo.dev',
        firstName: 'Admin',
        lastName: 'User',
      },
    ]);
  });
});
