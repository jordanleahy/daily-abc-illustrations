import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type ClientMode = 'service' | 'user' | 'public';

/**
 * Creates a Supabase client based on the authentication mode needed
 * - 'service': Uses service role key for admin operations (bypasses RLS)
 * - 'user': Uses anon key with user's auth header (respects RLS)
 * - 'public': Uses anon key without auth (for public endpoints)
 */
export function createSupabaseClient(
  mode: ClientMode,
  authHeader?: string | null
): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  if (mode === 'service') {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });
  }
  
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  if (mode === 'user' && authHeader) {
    return createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });
  }
  
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false }
  });
}

export interface AuthResult {
  userId: string;
  email?: string;
  token: string;
}

export interface AuthError {
  error: string;
  status: number;
}

/**
 * Verifies the JWT token and returns user information
 * Returns either the auth result or an error object
 */
export async function verifyAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<AuthResult | AuthError> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'No authorization header provided', status: 401 };
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    return { error: error?.message || 'Invalid token', status: 401 };
  }
  
  return {
    userId: data.user.id,
    email: data.user.email,
    token
  };
}

/**
 * Type guard to check if auth result is an error
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'error' in result && 'status' in result;
}

/**
 * Extracts the auth header from request
 */
export function getAuthHeader(req: Request): string | null {
  return req.headers.get('Authorization');
}

/**
 * Extracts just the token from the auth header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}
