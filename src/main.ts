import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { setupSwagger } from './common/config/swagger.config';
import { normalizeApiVersion } from './common/config/versioning.config';
import { StructuredLoggingInterceptor } from './common/interceptors/structured-logging.interceptor';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { createValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const apiPrefix = process.env.API_PREFIX ?? 'api';
  const apiVersion = normalizeApiVersion(process.env.API_VERSION);

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });
  app.use(RequestContextMiddleware);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new StructuredLoggingInterceptor());
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: listenning at http://localhost:${process.env.PORT ?? 3000}/${apiPrefix}/v${apiVersion}`);
}
bootstrap();
