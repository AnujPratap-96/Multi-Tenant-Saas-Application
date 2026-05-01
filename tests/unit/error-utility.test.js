import { describe, it, expect } from 'vitest';
import { mapZodErrors, ApiError } from '../../src/utils/api-error.js';

describe('ApiError Utility (Unit)', () => {
  describe('ApiError Class', () => {
    it('should correctly initialize with message and status', () => {
      const error = new ApiError(404, 'Not Found', { id: 'missing' });
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not Found');
      expect(error.details).toEqual({ id: 'missing' });
    });
  });

  describe('mapZodErrors', () => {
    it('should map undefined field to required message', () => {
      const mockZodError = {
        issues: [
          {
            code: 'invalid_type',
            received: 'undefined',
            path: ['email'],
            message: 'Required'
          }
        ]
      };

      const result = mapZodErrors(mockZodError);
      expect(result.email).toBe('Email is required');
    });

    it('should fall back to default message if field not in validationMessages', () => {
      const mockZodError = {
        issues: [
          {
            code: 'invalid_type',
            received: 'undefined',
            path: ['customField'],
            message: 'Custom Required'
          }
        ]
      };

      const result = mapZodErrors(mockZodError);
      expect(result.customField).toBe('This field is required');
    });
  });
});
