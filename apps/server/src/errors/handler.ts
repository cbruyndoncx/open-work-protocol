import { ZodError } from 'zod';
import { AppError, ValidationError, formatError } from './types.js';

export function handleValidationError(error: ZodError): ValidationError {
  const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
  return new ValidationError('Request validation failed', issues);
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return handleValidationError(error);
  }
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError('internal_error', error.message);
  }
  return new AppError('internal_error', 'Unknown error');
}

export { formatError };
