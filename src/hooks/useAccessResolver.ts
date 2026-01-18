import { useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';

export type AccessState = 'loading' | 'unlocked' | 'locked';

interface AccessResolverResult {
  accessState: AccessState;
  isReady: boolean;
  isUnlocked: boolean;
  isPrivileged: boolean;
  hasSubscription: boolean;
}

/**
 * Unified Access Resolver Hook (Free Tier)
 * 
 * All authenticated users get full access.
 * No subscription checks needed - the app is free to use.
 * 
 * Priority order:
 * - Not authenticated → locked
 * - Authenticated → unlocked
 */
export const useAccessResolver = (): AccessResolverResult => {
  const { user, loading: authLoading } = useAuthContext();
  const { hasRole, isLoading: roleLoading } = useRole();

  const isAdmin = hasRole('admin');
  const isTeacher = hasRole('teacher');
  const isPrivileged = isAdmin || isTeacher;

  const isLoading = authLoading || roleLoading;

  // All authenticated users are unlocked (free access)
  const isUnlocked = useMemo(() => {
    return !!user;
  }, [user]);

  const result = useMemo((): AccessResolverResult => {
    // Not authenticated - locked
    if (!user) {
      return {
        accessState: authLoading ? 'loading' : 'locked',
        isReady: !authLoading,
        isUnlocked: false,
        isPrivileged: false,
        hasSubscription: false,
      };
    }

    // Still loading role info
    if (isLoading) {
      return {
        accessState: 'loading',
        isReady: false,
        isUnlocked: true,
        isPrivileged: false,
        hasSubscription: true, // Treat all users as having subscription for compatibility
      };
    }

    // Authenticated user - full access
    return {
      accessState: 'unlocked',
      isReady: true,
      isUnlocked: true,
      isPrivileged,
      hasSubscription: true, // All authenticated users get "subscription" features
    };
  }, [user, isLoading, isPrivileged, authLoading]);

  return result;
};

/**
 * Clear access cache - kept for API compatibility
 */
export const clearAccessCache = () => {
  // No-op since we no longer cache subscription state
};
