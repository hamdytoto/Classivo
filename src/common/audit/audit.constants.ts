export const AUDIT_ACTIONS = {
  authLogin: 'auth.login',
  authRefresh: 'auth.refresh',
  authLogout: 'auth.logout',
  authLogoutAll: 'auth.logout_all',
  authChangePassword: 'auth.change_password',
  roleAssigned: 'authorization.role_assigned',
  roleRemoved: 'authorization.role_removed',
  permissionAssigned: 'authorization.permission_assigned',
  permissionRemoved: 'authorization.permission_removed',
} as const;
