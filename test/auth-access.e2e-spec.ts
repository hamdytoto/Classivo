import { INestApplication, VersioningType } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuditLogService } from '../src/common/audit/audit-log.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import {
  AuthRateLimitGuard,
  JwtAuthGuard,
  PermissionsGuard,
  RolesGuard,
} from '../src/common/guards';
import { createValidationPipe } from '../src/common/pipes/validation.pipe';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PrismaTransactionService } from '../src/common/prisma/prisma-transaction.service';
import { AuthorizationReadRepository } from '../src/common/repositories/authorization-read.repository';
import { hash } from '../src/common/security/hash.utils';
import { RefreshSessionService } from '../src/modules/auth/application/refresh-session.service';
import { LoginService } from '../src/modules/auth/application/login.service';
import { LogoutService } from '../src/modules/auth/application/logout.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthIdentityPolicy } from '../src/modules/auth/domain/policies/auth-identity.policy';
import { RefreshSessionPolicy } from '../src/modules/auth/domain/policies/refresh-session.policy';
import { AuthSessionRepository } from '../src/modules/auth/infrastructure/repositories/auth-session.repository';
import { AuthUserRepository } from '../src/modules/auth/infrastructure/repositories/auth-user.repository';
import { AuthTokenService } from '../src/modules/auth/infrastructure/security/auth-token.service';
import { PasswordHasherService } from '../src/modules/auth/infrastructure/security/password-hasher.service';
import { TokenHasherService } from '../src/modules/auth/infrastructure/security/token-hasher.service';
import { AuthController } from '../src/modules/auth/interface/auth.controller';
import { RolesController } from '../src/modules/roles/roles.controller';
import { RolesService } from '../src/modules/roles/roles.service';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { InMemoryPrismaService } from './support/in-memory-prisma.service';

describe('Auth + Access flows (e2e)', () => {
  let app: INestApplication;
  let prisma: InMemoryPrismaService;

  const ids = {
    adminUser: '11111111-1111-4111-8111-111111111111',
    teacherUser: '22222222-2222-4222-8222-222222222222',
    targetUser: '33333333-3333-4333-8333-333333333333',
    superAdminRole: '44444444-4444-4444-8444-444444444444',
    teacherRole: '55555555-5555-4555-8555-555555555555',
    schoolAdminRole: '66666666-6666-4666-8666-666666666666',
    usersReadPermission: '77777777-7777-4777-8777-777777777777',
  };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '7d';
    process.env.SALT_ROUND = '4';
  });

  beforeEach(async () => {
    prisma = new InMemoryPrismaService({
      users: [
        {
          id: ids.adminUser,
          schoolId: null,
          email: 'admin@classivo.dev',
          phone: null,
          passwordHash: await hash('Password123!'),
          firstName: 'Super',
          lastName: 'Admin',
          status: 'ACTIVE',
          lastLoginAt: null,
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
          updatedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
        {
          id: ids.teacherUser,
          schoolId: null,
          email: 'teacher@classivo.dev',
          phone: null,
          passwordHash: await hash('Teacher123!'),
          firstName: 'Terry',
          lastName: 'Teacher',
          status: 'ACTIVE',
          lastLoginAt: null,
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
          updatedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
        {
          id: ids.targetUser,
          schoolId: null,
          email: 'member@classivo.dev',
          phone: null,
          passwordHash: await hash('Member123!'),
          firstName: 'Mina',
          lastName: 'Member',
          status: 'ACTIVE',
          lastLoginAt: null,
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
          updatedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
      ],
      roles: [
        {
          id: ids.superAdminRole,
          code: 'SUPER_ADMIN',
          name: 'Super Admin',
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
          updatedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
        {
          id: ids.teacherRole,
          code: 'TEACHER',
          name: 'Teacher',
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
          updatedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
        {
          id: ids.schoolAdminRole,
          code: 'SCHOOL_ADMIN',
          name: 'School Admin',
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
          updatedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
      ],
      permissions: [
        {
          id: ids.usersReadPermission,
          code: 'users.read',
          name: 'Read Users',
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
          updatedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
      ],
      userRoles: [
        {
          userId: ids.adminUser,
          roleId: ids.superAdminRole,
          assignedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
        {
          userId: ids.teacherUser,
          roleId: ids.teacherRole,
          assignedAt: new Date('2026-03-21T00:00:00.000Z'),
        },
      ],
      rolePermissions: [
        {
          roleId: ids.superAdminRole,
          permissionId: ids.usersReadPermission,
          createdAt: new Date('2026-03-21T00:00:00.000Z'),
        },
      ],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      controllers: [AuthController, RolesController, UsersController],
      providers: [
        {
          provide: AuthService,
          useFactory: (
            loginService: LoginService,
            refreshSessionService: RefreshSessionService,
            logoutService: LogoutService,
          ) => ({
            login: loginService.execute.bind(loginService),
            refresh: refreshSessionService.execute.bind(refreshSessionService),
            logout: logoutService.execute.bind(logoutService),
            logoutAll: jest.fn(),
            revokeSession: jest.fn(),
            registerSchool: jest.fn(),
            changePassword: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            me: jest.fn(),
            sessions: jest.fn(),
          }),
          inject: [LoginService, RefreshSessionService, LogoutService],
        },
        LoginService,
        RefreshSessionService,
        LogoutService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        PrismaTransactionService,
        AuditLogService,
        AuthIdentityPolicy,
        RefreshSessionPolicy,
        AuthSessionRepository,
        AuthUserRepository,
        AuthTokenService,
        PasswordHasherService,
        TokenHasherService,
        RolesService,
        UsersService,
        AuthorizationReadRepository,
        AuthRateLimitGuard,
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
        {
          provide: APP_GUARD,
          useClass: PermissionsGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should complete login -> refresh -> logout and block refresh after logout', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@classivo.dev',
        password: 'Password123!',
      })
      .expect(201);

    expect(loginResponse.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          id: ids.adminUser,
          email: 'admin@classivo.dev',
        }),
      }),
    );

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: loginResponse.body.refreshToken,
      })
      .expect(201);

    expect(refreshResponse.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          id: ids.adminUser,
        }),
      }),
    );
    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken,
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(204);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(401)
      .expect(({ body }) => {
        expect(body.error.code).toBe('REFRESH_TOKEN_REVOKED');
      });
  });

  it('should allow a super admin to assign a role and inspect the assigned user roles', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@classivo.dev',
        password: 'Password123!',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/roles/users/${ids.targetUser}/${ids.schoolAdminRole}`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({
          userId: ids.targetUser,
          roleId: ids.schoolAdminRole,
          assigned: true,
        });
      });

    await request(app.getHttpServer())
      .get(`/api/v1/users/${ids.targetUser}/roles`)
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.userId).toBe(ids.targetUser);
        expect(body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: ids.schoolAdminRole,
              code: 'SCHOOL_ADMIN',
              name: 'School Admin',
            }),
          ]),
        );
      });
  });

  it('should deny role-protected and permission-protected routes for insufficient access', async () => {
    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'teacher@classivo.dev',
        password: 'Teacher123!',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/roles/users/${ids.targetUser}/${ids.schoolAdminRole}`)
      .set('Authorization', `Bearer ${teacherLogin.body.accessToken}`)
      .expect(403)
      .expect(({ body }) => {
        expect(body.error.code).toBe('INSUFFICIENT_ROLE');
      });

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${teacherLogin.body.accessToken}`)
      .expect(403)
      .expect(({ body }) => {
        expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
      });
  });
});
