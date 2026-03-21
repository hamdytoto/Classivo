import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function AtLeastOneOf(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneOf',
      target: object.constructor,
      propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const [props] = args.constraints as [string[]];
          const candidate = args.object as Record<string, unknown>;

          return props.some((prop) => {
            const value = candidate[prop];
            return value !== undefined && value !== null;
          });
        },

        defaultMessage(args: ValidationArguments) {
          const [props] = args.constraints as [string[]];
          return `At least one of ${props.join(' or ')} must be provided`;
        },
      },
    });
  };
}
