export class AppError extends Error {
    code;
    details;
    suggestion;
    constructor(code, message, details, suggestion) {
        super(message);
        this.code = code;
        this.details = details;
        this.suggestion = suggestion;
    }
}
export class ValidationError extends AppError {
    constructor(message, details) {
        super('validation_error', message, details, 'Check request format and required fields');
    }
}
export class AuthError extends AppError {
    constructor(message) {
        super('auth_error', message, undefined, 'Provide valid authentication token');
    }
}
export class NotFoundError extends AppError {
    constructor(message) {
        super('not_found', message, undefined, 'Resource does not exist');
    }
}
export class ConflictError extends AppError {
    constructor(message) {
        super('conflict', message, undefined, 'Resource already exists or state conflict');
    }
}
export function formatError(error) {
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
//# sourceMappingURL=types.js.map