import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { normalizeApiVersion } from './versioning.config';

export function setupSwagger(app: INestApplication): void {
  const swaggerPath = process.env.SWAGGER_PATH ?? 'docs';
  const apiPrefix = process.env.API_PREFIX ?? 'api';
  const apiVersion = normalizeApiVersion(process.env.API_VERSION);
  const apiBasePath = `/${apiPrefix}/v${apiVersion}`;

  const config = new DocumentBuilder()
    .setTitle('Classivo API')
    .setDescription('Classivo backend API documentation')
    .setVersion('1.0.0')
    // .addServer(apiBasePath, 'Versioned API base path')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
