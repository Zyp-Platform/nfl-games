/**
 * API Validation Utilities
 * Provides runtime validation of API responses using Zod schemas
 */

import { ZodSchema, ZodError } from 'zod';

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  error: string;
  details: ZodError;
}

/**
 * Validates API response data against a Zod schema
 * Throws detailed error with validation information if validation fails
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: ZodSchema
): ValidationResult<T> | ValidationError {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data as T,
      };
    }

    return {
      success: false,
      error: 'API response validation failed',
      details: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Unexpected error during validation',
      details: error as ZodError,
    };
  }
}

/**
 * Creates a validated API fetch function
 * Automatically validates responses against the provided schema
 */
export function createValidatedApiCall<T>(schema: ZodSchema) {
  return async (
    url: string,
    options?: RequestInit
  ): Promise<ValidationResult<T> | ValidationError> => {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: new ZodError([]),
        };
      }

      const data = await response.json();
      return validateApiResponse<T>(data, schema);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
        details: new ZodError([]),
      };
    }
  };
}

/**
 * Format validation error for user display
 */
export function formatValidationError(error: ZodError): string {
  const issues = error.errors;
  if (issues.length === 0) return 'Validation failed';

  const firstIssue = issues[0];
  const path = firstIssue.path.join('.');
  return path ? `${path}: ${firstIssue.message}` : firstIssue.message;
}
