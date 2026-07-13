import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

const formatErrors = (errors: ValidationError[], parentProperty = ''): Record<string, string> => {
  return errors.reduce(
    (acc, error) => {
      const propertyPath = parentProperty ? `${parentProperty}.${error.property}` : error.property;

      if (error.constraints) {
        acc[propertyPath] = Object.values(error.constraints)[0];
      }

      if (error.children && error.children.length > 0) {
        const childrenErrors = formatErrors(error.children, propertyPath);
        Object.assign(acc, childrenErrors);
      }

      return acc;
    },
    {} as Record<string, string>,
  );
};

export const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => {
    const flattenedErrors = formatErrors(errors);

    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      fields: flattenedErrors,
    });
  },
});
