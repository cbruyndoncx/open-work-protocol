export type ErrorCode = 'validation_error' | 'auth_error' | 'not_found' | 'conflict' | 'internal_error';
export interface ErrorResponse {
    code: ErrorCode;
    message: string;
    details?: string;
    suggestion?: string;
}
export declare class AppError extends Error {
    code: ErrorCode;
    details?: string | undefined;
    suggestion?: string | undefined;
    constructor(code: ErrorCode, message: string, details?: string | undefined, suggestion?: string | undefined);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: string);
}
export declare class AuthError extends AppError {
    constructor(message: string);
}
export declare class NotFoundError extends AppError {
    constructor(message: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare function formatError(error: unknown): ErrorResponse;
//# sourceMappingURL=types.d.ts.map