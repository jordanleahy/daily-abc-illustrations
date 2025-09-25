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
    console.log('useAuth: Setting up auth listener');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.email || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    console.log('useAuth: Checking for existing session');
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('useAuth: Error getting session:', error);
        } else {
          console.log('useAuth: Initial session check:', session?.user?.email || 'no session');
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('useAuth: Session check failed:', error);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
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