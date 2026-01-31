import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createSupabaseClient, verifyAuth, isAuthError, ClientMode, AuthResult } from './auth.ts';
import { corsResponse, errorResponse, handleException } from './response.ts';

export interface HandlerContext {
  req: Request;
  supabase: SupabaseClient;
  user: AuthResult | null;
}

export interface HandlerConfig {
  /** Name of the function for logging */
  name: string;
  /** Client mode: 'service' for admin ops, 'user' for RLS-respecting, 'public' for no auth */
  clientMode: ClientMode;
  /** Whether authentication is required (default: true for 'user' mode, false otherwise) */
  requireAuth?: boolean;
  /** Allowed HTTP methods (default: ['POST']) */
  methods?: string[];
}

export type HandlerFunction = (context: HandlerContext) => Promise<Response>;

/**
 * Creates a standardized edge function handler with:
 * - CORS preflight handling
 * - HTTP method validation
 * - Supabase client initialization
 * - Optional JWT authentication
 * - Centralized error handling and logging
 * 
 * @example
 * ```typescript
 * Deno.serve(createHandler({
 *   name: 'my-function',
 *   clientMode: 'user',
 * }, async ({ supabase, user, req }) => {
 *   const { data, error } = await supabase.from('table').select();
 *   return successResponse({ data });
 * }));
 * ```
 */
export function createHandler(
  config: HandlerConfig,
  handler: HandlerFunction
): (req: Request) => Promise<Response> {
  const {
    name,
    clientMode,
    requireAuth = clientMode === 'user',
    methods = ['POST']
  } = config;

  const logStep = (step: string, details?: unknown) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[${name.toUpperCase()}] ${step}${detailsStr}`);
  };

  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return corsResponse();
    }

    // Validate HTTP method
    if (!methods.includes(req.method)) {
      return errorResponse(`Method ${req.method} not allowed`, 405);
    }

    logStep('Function started');

    try {
      // Initialize Supabase client
      const authHeader = req.headers.get('Authorization');
      const supabase = createSupabaseClient(clientMode, authHeader);
      
      let user: AuthResult | null = null;

      // Verify authentication if required
      if (requireAuth) {
        const authResult = await verifyAuth(req, supabase);
        
        if (isAuthError(authResult)) {
          logStep('Auth failed', { error: authResult.error });
          return errorResponse(authResult.error, authResult.status);
        }
        
        user = authResult;
        logStep('User authenticated', { userId: user.userId });
      }

      // Execute the handler
      const response = await handler({ req, supabase, user });
      
      logStep('Function completed successfully');
      return response;

    } catch (error) {
      logStep('Function error', { error: error instanceof Error ? error.message : error });
      return handleException(error, name);
    }
  };
}

/**
 * Helper to parse JSON body with error handling
 */
export async function parseBody<T>(req: Request): Promise<T> {
  try {
    return await req.json() as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Helper to get required query parameter
 */
export function getRequiredParam(url: URL, param: string): string {
  const value = url.searchParams.get(param);
  if (!value) {
    throw new Error(`Missing required parameter: ${param}`);
  }
  return value;
}

/**
 * Helper to get optional query parameter with default
 */
export function getParam(url: URL, param: string, defaultValue: string = ''): string {
  return url.searchParams.get(param) || defaultValue;
}
