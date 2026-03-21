import { ApiUnauthorizedExamplesResponse } from './api-error-responses';
import {
  CHANGE_PASSWORD_UNAUTHORIZED_EXAMPLES,
  LOGIN_UNAUTHORIZED_EXAMPLES,
  LOGOUT_UNAUTHORIZED_EXAMPLES,
  REFRESH_UNAUTHORIZED_EXAMPLES,
  RESET_PASSWORD_UNAUTHORIZED_EXAMPLES,
} from './auth-unauthorized-examples';

export function ApiLoginUnauthorized(path: string) {
  return ApiUnauthorizedExamplesResponse(LOGIN_UNAUTHORIZED_EXAMPLES, path);
}

export function ApiRefreshUnauthorized(path: string) {
  return ApiUnauthorizedExamplesResponse(REFRESH_UNAUTHORIZED_EXAMPLES, path);
}

export function ApiLogoutUnauthorized(path: string) {
  return ApiUnauthorizedExamplesResponse(LOGOUT_UNAUTHORIZED_EXAMPLES, path);
}

export function ApiResetPasswordUnauthorized(path: string) {
  return ApiUnauthorizedExamplesResponse(
    RESET_PASSWORD_UNAUTHORIZED_EXAMPLES,
    path,
  );
}

export function ApiChangePasswordUnauthorized(path: string) {
  return ApiUnauthorizedExamplesResponse(
    CHANGE_PASSWORD_UNAUTHORIZED_EXAMPLES,
    path,
  );
}
