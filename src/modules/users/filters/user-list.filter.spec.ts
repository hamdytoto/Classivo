import {
  buildUserWhere,
  filterUserPermissions,
  filterUserRoles,
} from './user-list.filter';

describe('user-list.filter', () => {
  it('should build Prisma where filters for user listings', () => {
    expect(
      buildUserWhere({
        schoolId: 'school-1',
        status: 'ACTIVE',
        email: 'classivo.dev',
        phone: '0100',
      }),
    ).toEqual({
      schoolId: 'school-1',
      status: 'ACTIVE',
      email: {
        contains: 'classivo.dev',
        mode: 'insensitive',
      },
      phone: {
        contains: '0100',
      },
    });
  });

  it('should filter role lists by code and name', () => {
    expect(
      filterUserRoles(
        [
          { code: 'SCHOOL_ADMIN', name: 'School Admin' },
          { code: 'TEACHER', name: 'Teacher' },
        ],
        { code: 'admin' },
      ),
    ).toEqual([{ code: 'SCHOOL_ADMIN', name: 'School Admin' }]);
  });

  it('should filter permission lists by code and name', () => {
    expect(
      filterUserPermissions(
        [
          { code: 'users.read', name: 'Read Users' },
          { code: 'courses.read', name: 'Read Courses' },
        ],
        { name: 'users' },
      ),
    ).toEqual([{ code: 'users.read', name: 'Read Users' }]);
  });
});
