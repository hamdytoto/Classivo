export const LOGIN_UNAUTHORIZED_EXAMPLES = {
    invalidCredentials: {
        summary: 'Email/phone or password is incorrect',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid login credentials',
    },
    accountSuspended: {
        summary: 'Suspended account cannot authenticate',
        code: 'ACCOUNT_SUSPENDED',
        message: 'Account is suspended',
    },
    accountDisabled: {
        summary: 'Disabled account cannot authenticate',
        code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled',
    },
} as const;

export const REFRESH_UNAUTHORIZED_EXAMPLES = {
    invalidRefreshToken: {
        summary: 'Refresh token cannot be verified',
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid',
    },
    refreshTokenExpired: {
        summary: 'Refresh token is expired',
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired',
    },
    refreshTokenRevoked: {
        summary: 'Refresh token was revoked previously',
        code: 'REFRESH_TOKEN_REVOKED',
        message: 'Refresh token has been revoked',
    },
    refreshTokenReused: {
        summary: 'Refresh token reuse was detected',
        code: 'REFRESH_TOKEN_REUSED',
        message: 'Refresh token reuse detected',
    },
} as const;

export const LOGOUT_UNAUTHORIZED_EXAMPLES = {
    invalidRefreshToken: {
        summary: 'Refresh token cannot be used for logout',
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid',
    },
    refreshTokenRevoked: {
        summary: 'Refresh token has already been revoked',
        code: 'REFRESH_TOKEN_REVOKED',
        message: 'Refresh token has been revoked',
    },
} as const;

export const RESET_PASSWORD_UNAUTHORIZED_EXAMPLES = {
    invalidPasswordResetOtp: {
        summary: 'OTP is invalid, expired, or already consumed',
        code: 'INVALID_PASSWORD_RESET_OTP',
        message: 'Password reset OTP is invalid or expired',
    },
} as const;

export const CHANGE_PASSWORD_UNAUTHORIZED_EXAMPLES = {
    invalidCurrentPassword: {
        summary: 'Current password does not match',
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect',
    },
    accountSuspended: {
        summary: 'Suspended account cannot change password',
        code: 'ACCOUNT_SUSPENDED',
        message: 'Account is suspended',
    },
    accountDisabled: {
        summary: 'Disabled account cannot change password',
        code: 'ACCOUNT_DISABLED',
        message: 'Account is disabled',
    },
} as const;

export const AUTH_PATHS = {
    login: '/api/v1/auth/login',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
    logoutAll: '/api/v1/auth/logout-all',
    resetPassword: '/api/v1/auth/reset-password',
    changePassword: '/api/v1/auth/change-password',
    registerSchool: '/api/v1/auth/register-school',
} as const;