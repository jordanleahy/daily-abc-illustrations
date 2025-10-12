/**
 * @fileoverview Authentication state management hook
 * 
 * This hook provides centralized authentication state management using Supabase Auth.
 * It handles user sessions, authentication status, and provides methods for signing out.
 * 
 * Key Features:
 * - Real-time authentication state tracking
 * - Session management with automatic refresh
 * - Loading states during authentication checks
 * - Sign out functionality
 * 
 * @version 1.0.0
 * @author ABC Cards Team
 */

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SafeLocalStorage, SUBSCRIPTION_CACHE_KEY } from '@/utils/storage';

/**
 * Authentication state management hook
 * 
 * Manages user authentication state with Supabase Auth. Provides real-time
 * updates when authentication state changes and handles session persistence.
 * 
 * @hook
 * @returns {Object} Authentication state and methods
 * @returns {User | null} user - Current authenticated user or null
 * @returns {Session | null} session - Current session or null
 * @returns {boolean} loading - Whether authentication state is being loaded
 * @returns {Function} signOut - Function to sign out the current user
 * @returns {boolean} isAuthenticated - Computed boolean indicating if user is authenticated
 * 
 * @example
 * ```tsx
 * const { user, session, loading, signOut, isAuthenticated } = useAuth();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (!isAuthenticated) return <div>Please sign in</div>;
 * 
 * return <div>Welcome, {user.email}!</div>;
 * ```
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Single source of truth: auth state listener handles both initial load and changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // The auth listener automatically fires on setup with current session
    // No need for separate getSession() call which was causing race condition

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
};