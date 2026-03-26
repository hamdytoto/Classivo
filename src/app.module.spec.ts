import { MODULE_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from './common/guards';
import { AuthorizationReadRepository } from './common/repositories/authorization-read.repository';
import { AppModule } from './app.module';

describe('AppModule metadata', () => {
  it('should register the shared authorization providers at the app level', () => {
    const providers =
      Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule) ?? [];

    expect(providers).toEqual(
      expect.arrayContaining([
        AuthorizationReadRepository,
        JwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
        expect.objectContaining({
          provide: APP_GUARD,
          useExisting: JwtAuthGuard,
        }),
        expect.objectContaining({
          provide: APP_GUARD,
          useExisting: RolesGuard,
        }),
        expect.objectContaining({
          provide: APP_GUARD,
          useExisting: PermissionsGuard,
        }),
      ]),
    );
  });
});
