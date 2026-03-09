const BASELINE_ROLES = [
  { code: 'SUPER_ADMIN', name: 'Super Admin' },
  { code: 'SCHOOL_ADMIN', name: 'School Admin' },
  { code: 'TEACHER', name: 'Teacher' },
  { code: 'STUDENT', name: 'Student' },
  { code: 'PARENT', name: 'Parent' },
  { code: 'SUPPORT', name: 'Support' },
];

const PERMISSIONS = [
  { code: 'users.read', name: 'Read users' },
  { code: 'users.manage', name: 'Manage users' },
  { code: 'schools.read', name: 'Read schools' },
  { code: 'schools.manage', name: 'Manage schools' },
  { code: 'classes.read', name: 'Read classes' },
  { code: 'classes.manage', name: 'Manage classes' },
  { code: 'courses.read', name: 'Read courses' },
  { code: 'courses.manage', name: 'Manage courses' },
  { code: 'lessons.manage', name: 'Manage lessons' },
  { code: 'assignments.manage', name: 'Manage assignments' },
  { code: 'submissions.read', name: 'Read submissions' },
  { code: 'grades.manage', name: 'Manage grades' },
  { code: 'attendance.manage', name: 'Manage attendance' },
  { code: 'announcements.manage', name: 'Manage announcements' },
];

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: PERMISSIONS.map((permission) => permission.code),
  SCHOOL_ADMIN: [
    'users.read',
    'users.manage',
    'schools.read',
    'schools.manage',
    'classes.read',
    'classes.manage',
    'courses.read',
    'courses.manage',
    'attendance.manage',
    'announcements.manage',
  ],
  TEACHER: [
    'courses.read',
    'lessons.manage',
    'assignments.manage',
    'submissions.read',
    'grades.manage',
    'attendance.manage',
    'announcements.manage',
  ],
  STUDENT: ['courses.read', 'submissions.read'],
  PARENT: ['courses.read'],
  SUPPORT: ['users.read', 'schools.read', 'courses.read'],
};

module.exports = {
  BASELINE_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
};
