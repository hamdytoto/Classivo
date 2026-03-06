import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const swaggerPath = process.env.SWAGGER_PATH ?? 'docs';

  const config = new DocumentBuilder()
    .setTitle('Classivo API')
    .setDescription('Classivo backend API documentation')
    .setVersion('1.0.0')
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
