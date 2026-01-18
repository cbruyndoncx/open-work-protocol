import { ZodError } from 'zod';
import { AppError, ValidationError, formatError } from './types.js';
export declare function handleValidationError(error: ZodError): ValidationError;
export declare function handleError(error: unknown): AppError;
export { formatError };
//# sourceMappingURL=handler.d.ts.map