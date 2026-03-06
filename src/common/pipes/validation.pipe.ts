import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    stopAtFirstError: false,
    exceptionFactory: (errors: ValidationError[]) => {
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
  });
}
