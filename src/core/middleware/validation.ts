import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validation middleware for API routes
 * Validates request body against Zod schema
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

/**
 * Create validation middleware for API route handlers
 */
export function createValidationMiddleware<T extends z.ZodType>(schema: T) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validation = validateRequest(schema, body);
      
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.error.errors,
          },
          { status: 400 }
        );
      }
      
      return validation.data;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  };
}


