# Sprint 1 - Bullet 4: JWT Access Token Issuance

## Goal
Implement Sprint 1 TODO bullet 4 by issuing a JWT access token on successful login.

## Scope
- Extend `POST /auth/login` response to include an access token.
- Token should be signed using `JWT_ACCESS_SECRET`.
- Token TTL should follow `JWT_ACCESS_TTL`.
- Include core claims needed for next auth/authorization bullets.

## Technical Plan
1. Keep a shared JWT TTL helper in `src/common/security` and remove manual token signing logic.
2. Register `JwtModule` in `AuthModule` using `JWT_ACCESS_SECRET` and `JWT_ACCESS_TTL`.
3. Update `AuthService.login` to:
   - Build token payload (`sub`, `schoolId`, `email`, `phone`, `status`).
   - Sign the access token with `JwtService.signAsync`.
   - Return token metadata with the authenticated user.
4. Update auth unit tests to mock or spy on `JwtService` and assert the login response contract.

## Execution Record
- [x] Created sprint plan doc for bullet 4.
- [x] Replace manual JWT signing with `@nestjs/jwt`.
- [x] Reuse shared TTL parsing for module config and response metadata.
- [x] Add or update auth tests for `JwtService`-based token issuance.
- [x] Run focused checks (`pnpm.cmd build`, `node ./node_modules/jest/bin/jest.js src/modules/auth/auth.service.spec.ts --runInBand`, `node ./node_modules/jest/bin/jest.js src/modules/auth/auth.controller.spec.ts --runInBand`).
