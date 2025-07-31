import { z } from 'zod';

/**
 * Validates data against a Zod schema and returns typed result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Safely validates data and returns undefined if invalid
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | undefined {
  const result = validateData(schema, data);
  return result.success ? result.data : undefined;
}

/**
 * Creates a validation middleware for Lambda functions
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = validateData(schema, data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors.join(', ')}`);
    }
    return result.data;
  };
}

/**
 * Validates pagination parameters
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Validates date range parameters
 */
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['dateRange'],
  }
);

export type DateRangeParams = z.infer<typeof DateRangeSchema>;

/**
 * Validates chamber filter parameter
 */
export const ChamberFilterSchema = z.object({
  chamber: z.enum(['senado', 'camara']).optional(),
});

export type ChamberFilterParams = z.infer<typeof ChamberFilterSchema>;

/**
 * Common API request validation schemas
 */
export const CommonRequestSchemas = {
  pagination: PaginationSchema,
  dateRange: DateRangeSchema,
  chamberFilter: ChamberFilterSchema,

  // Combined schemas for common use cases
  paginatedRequest: PaginationSchema.merge(ChamberFilterSchema),
  dateRangeRequest: DateRangeSchema.merge(ChamberFilterSchema),
  fullRequest: PaginationSchema.merge(DateRangeSchema).merge(ChamberFilterSchema),
};
