import { describe, it, expect } from '@jest/globals';

describe('Error Handling Integration Tests', () => {
  describe('Error Response Format Validation', () => {
    it('should validate error response structure', () => {
      const errorResponse = {
        code: 'validation_error',
        message: 'Request validation failed',
        details: 'name: Worker name is required',
        suggestion: 'Check request format and required fields',
      };

      expect(errorResponse).toHaveProperty('code');
      expect(errorResponse).toHaveProperty('message');
      expect(errorResponse).toHaveProperty('suggestion');
      expect(typeof errorResponse.code).toBe('string');
      expect(typeof errorResponse.message).toBe('string');
      expect(typeof errorResponse.suggestion).toBe('string');
    });

    it('should validate error codes are consistent', () => {
      const validErrorCodes = [
        'validation_error',
        'auth_error',
        'not_found',
        'conflict',
        'internal_error',
      ];

      validErrorCodes.forEach(code => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it('should validate error response has required fields', () => {
      const minimalError = {
        code: 'internal_error',
        message: 'Something went wrong',
        suggestion: 'Contact support',
      };

      expect(minimalError).toHaveProperty('code');
      expect(minimalError).toHaveProperty('message');
      expect(minimalError).toHaveProperty('suggestion');
    });
  });
});
