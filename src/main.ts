import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const details = errors.flatMap((error) => {
          const constraints = error.constraints ?? {};
          return Object.values(constraints).map((message) => ({
            field: error.property,
            message,
          }));
        });

        return new BadRequestException({
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details,
        });
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
