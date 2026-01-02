/**
 * Validation Hooks for NFL Games Frontend
 * Provides form validation and API response validation using Zod schemas
 */

import { useCallback } from 'react';
import { useForm, type UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ZodSchema, type ZodTypeAny, type z, ZodError } from 'zod';

/**
 * Enhanced form validation hook using Zod schemas
 * Combines react-hook-form with Zod for type-safe validation
 */
export function useValidatedForm<T extends ZodTypeAny>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
) {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...options,
  });
}

/**
 * API response validation hook
 * Validates API responses against Zod schemas at runtime
 */
export function useApiResponseValidation<T>(schema: ZodSchema) {
  return useCallback(
    (data: unknown): { success: true; data: T } | { success: false; error: ZodError } => {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data as T };
      }
      return { success: false, error: result.error };
    },
    [schema]
  );
}

/**
 * Form error formatter
 * Converts Zod validation errors to display-friendly format
 */
export function formatFormErrors(error: ZodError) {
  return error.flatten((issue) => ({
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Extract error message for a specific field
 */
export function getFieldError(error: ZodError, fieldPath: string): string | undefined {
  const flattened = error.flatten();
  const fieldErrors = flattened.fieldErrors as Record<string, string[] | undefined>;
  return fieldErrors[fieldPath]?.[0];
}
