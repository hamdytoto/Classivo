export const AUTH_ERROR_CODES = {
  accountInactive: 'ACCOUNT_INACTIVE',
  baselineRoleNotFound: 'BASELINE_ROLE_NOT_FOUND',
  invalidCredentials: 'INVALID_CREDENTIALS',
  invalidCurrentPassword: 'INVALID_CURRENT_PASSWORD',
  invalidLoginIdentifier: 'INVALID_LOGIN_IDENTIFIER',
  invalidPasswordResetOtp: 'INVALID_PASSWORD_RESET_OTP',
  invalidRefreshToken: 'INVALID_REFRESH_TOKEN',
  refreshTokenExpired: 'REFRESH_TOKEN_EXPIRED',
  refreshTokenRequired: 'REFRESH_TOKEN_REQUIRED',
  refreshTokenRevoked: 'REFRESH_TOKEN_REVOKED',
  refreshTokenReused: 'REFRESH_TOKEN_REUSED',
  sessionNotFound: 'SESSION_NOT_FOUND',
  sessionOwnershipMismatch: 'SESSION_OWNERSHIP_MISMATCH',
  userNotFound: 'USER_NOT_FOUND',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
