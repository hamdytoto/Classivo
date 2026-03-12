import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function ExactlyOneOf(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'exactlyOneOf',
      target: object.constructor,
      propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const [props] = args.constraints as [string[]];
          const object = args.object as Record<string, any>;

          const definedCount = props.filter(
            (prop) => object[prop] !== undefined && object[prop] !== null,
          ).length;

          return definedCount === 1;
        },

        defaultMessage(args: ValidationArguments) {
          const [props] = args.constraints as [string[]];
          return `Exactly one of ${props.join(' or ')} must be provided`;
        },
      },
    });
  };
}
