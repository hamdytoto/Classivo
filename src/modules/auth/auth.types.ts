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
