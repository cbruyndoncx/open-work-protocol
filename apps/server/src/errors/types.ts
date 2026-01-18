export type ErrorCode = 
  | 'validation_error'
  | 'auth_error'
  | 'not_found'
  | 'conflict'
  | 'internal_error';

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: string;
  suggestion?: string;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: string,
    public suggestion?: string
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: string) {
    super('validation_error', message, details, 'Check request format and required fields');
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super('auth_error', message, undefined, 'Provide valid authentication token');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super('not_found', message, undefined, 'Resource does not exist');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('conflict', message, undefined, 'Resource already exists or state conflict');
  }
}

export function formatError(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      suggestion: error.suggestion,
    };
  }
  
  if (error instanceof Error) {
    return {
      code: 'internal_error',
      message: error.message,
      suggestion: 'Contact support if issue persists',
    };
  }

  return {
    code: 'internal_error',
    message: 'Unknown error occurred',
    suggestion: 'Contact support if issue persists',
  };
}
