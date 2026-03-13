import { UserStatus } from '@prisma/client';

export type SessionContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuthenticatedUser = {
  id: string;
  schoolId: string | null;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthenticatedUserRoleAssignment = {
  role: {
    code: string;
    permissions: Array<{
      permission: { code: string };
    }>;
  };
};

export type AuthenticatedUserProfile = AuthenticatedUser & {
  roles: string[];
  permissions: string[];
};

export type AuthenticatedUserProfileSource = AuthenticatedUser & {
  roles: AuthenticatedUserRoleAssignment[];
};

export type AccessTokenPayload = {
  sub: string;
  schoolId: string | null;
  email: string | null;
  phone: string | null;
  status: UserStatus;
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  type: 'refresh';
};

export type AuthTokenPair = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
};

export type PasswordResetMailContent = {
  subject: string;
  html: string;
  text: string;
};
