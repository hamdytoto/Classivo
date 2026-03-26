import { MODULE_METADATA } from '@nestjs/common/constants';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth.module';

describe('AuthModule metadata', () => {
  it('should only export the shared jwt module contract', () => {
    const exportedProviders =
      Reflect.getMetadata(MODULE_METADATA.EXPORTS, AuthModule) ?? [];

    expect(exportedProviders).toEqual([JwtModule]);
  });
});
