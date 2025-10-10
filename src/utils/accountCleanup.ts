import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive cleanup of all user-specific data from local storage
 * and application state when an account is deleted.
 */
export const performAccountCleanup = async (): Promise<void> => {
  try {
    // Step 1: Clear all agent-specific localStorage keys
    const allKeys = Object.keys(localStorage);
    const agentKeys = allKeys.filter(key => key.startsWith('agent-last-change-'));
    agentKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[CLEANUP] Removed: ${key}`);
    });

    // Step 2: Clear all Supabase auth keys (pattern: sb-{project-ref}-auth-*)
    const supabaseKeys = allKeys.filter(key => key.startsWith('sb-foxdnspwzhjxjxuicute-auth-'));
    supabaseKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[CLEANUP] Removed Supabase key: ${key}`);
    });

    // Step 3: Sign out locally (clears Supabase session without API call)
    await supabase.auth.signOut({ scope: 'local' });
    console.log('[CLEANUP] Signed out locally');

    // Step 4: Clear any remaining app-specific keys (add more patterns as needed)
    const appKeys = allKeys.filter(key => 
      key.startsWith('app-') || 
      key.startsWith('user-') ||
      key.startsWith('cache-')
    );
    appKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[CLEANUP] Removed app key: ${key}`);
    });

    console.log('[CLEANUP] Account cleanup completed successfully');
  } catch (error) {
    console.error('[CLEANUP] Error during account cleanup:', error);
    // Still try to sign out and redirect even if cleanup fails
    await supabase.auth.signOut({ scope: 'local' });
  }
};

/**
 * Force complete application reset after account deletion
 */
export const forceApplicationReset = (): void => {
  // Use replace() to prevent back button navigation
  window.location.replace('/');
};
