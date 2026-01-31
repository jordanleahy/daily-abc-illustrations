import { corsHeaders } from './cors.ts';

/**
 * Creates a successful JSON response with CORS headers
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Creates an error JSON response with CORS headers
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): Response {
  const body: Record<string, unknown> = { error: message };
  
  if (details) {
    Object.assign(body, details);
  }
  
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Creates a CORS preflight response
 */
export function corsResponse(): Response {
  return new Response(null, { headers: corsHeaders });
}

/**
 * Standard error responses for common cases
 */
export const errors = {
  unauthorized: (message = 'Unauthorized') => errorResponse(message, 401),
  forbidden: (message = 'Forbidden') => errorResponse(message, 403),
  notFound: (message = 'Not found') => errorResponse(message, 404),
  badRequest: (message = 'Bad request') => errorResponse(message, 400),
  conflict: (message = 'Conflict') => errorResponse(message, 409),
  rateLimit: (message = 'Rate limit exceeded') => errorResponse(message, 429),
  paymentRequired: (message = 'Payment required') => errorResponse(message, 402),
  internal: (message = 'Internal server error') => errorResponse(message, 500),
};

/**
 * Wraps database errors with user-friendly messages
 */
export function handleDatabaseError(error: { message: string; code?: string }): Response {
  console.error('Database error:', error);
  
  // Handle common Postgres error codes
  if (error.code === '23505') {
    return errors.conflict('Resource already exists');
  }
  if (error.code === '23503') {
    return errors.badRequest('Referenced resource not found');
  }
  if (error.code === '42501') {
    return errors.forbidden('Insufficient permissions');
  }
  
  return errors.internal(error.message);
}

/**
 * Logs and returns an error response for caught exceptions
 */
export function handleException(
  error: unknown,
  context: string
): Response {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] Error:`, message);
  
  return errors.internal(message);
}
