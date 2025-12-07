import { useMemo, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useSubscription } from '@/hooks/useSubscription';
import { SafeLocalStorage, ACCESS_STATE_CACHE_KEY, ACCESS_STATE_CACHE_HOURS } from '@/utils/storage';

export type AccessState = 'loading' | 'unlocked' | 'locked';

interface CachedAccessState {
  userId: string;
  isUnlocked: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  hasSubscription: boolean;
  cachedAt: number;
}

interface AccessResolverResult {
  accessState: AccessState;
  isReady: boolean;
  isUnlocked: boolean;
  isPrivileged: boolean;
  hasSubscription: boolean;
}

/**
 * Unified Access Resolver Hook
 * 
 * Single source of truth for access control that:
 * 1. Returns cached state INSTANTLY on first render (no loading flicker)
 * 2. Combines auth, role, and subscription checks into one atomic state
 * 3. Outputs simple locked/unlocked/loading state
 * 
 * Priority order:
 * - Admin/Teacher roles → always unlocked
 * - Active subscription → unlocked
 * - No subscription → locked
 */
export const useAccessResolver = (): AccessResolverResult => {
  const { user, loading: authLoading } = useAuthContext();
  const { hasRole, isLoading: roleLoading } = useRole();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();

  // Step 1: Check cache SYNCHRONOUSLY for instant first render
  const cachedState = useMemo(() => {
    if (!user?.id) return null;
    const cached = SafeLocalStorage.get<CachedAccessState>(ACCESS_STATE_CACHE_KEY);
    if (cached && cached.userId === user.id) {
      return cached;
    }
    return null;
  }, [user?.id]);

  // Step 2: Compute current state from hooks
  const isAdmin = hasRole('admin');
  const isTeacher = hasRole('teacher');
  const isPrivileged = isAdmin || isTeacher;

  // Step 3: Determine if we're still loading
  const isLoading = authLoading || roleLoading || subscriptionLoading;

  // Step 4: Compute unlocked state
  const isUnlocked = useMemo(() => {
    // Privileged users always have access
    if (isPrivileged) return true;
    // Check subscription
    return hasActiveSubscription;
  }, [isPrivileged, hasActiveSubscription]);

  // Step 5: Update cache when we have fresh data (useEffect for side effects)
  useEffect(() => {
    if (!user?.id || isLoading) return;
    
    const newCacheState: CachedAccessState = {
      userId: user.id,
      isUnlocked,
      isAdmin,
      isTeacher,
      hasSubscription: hasActiveSubscription,
      cachedAt: Date.now(),
    };
    
    SafeLocalStorage.set(ACCESS_STATE_CACHE_KEY, newCacheState, ACCESS_STATE_CACHE_HOURS);
  }, [user?.id, isLoading, isUnlocked, isAdmin, isTeacher, hasActiveSubscription]);

  // Step 6: Determine access state with cache-first approach
  const result = useMemo((): AccessResolverResult => {
    // Not authenticated - always locked
    if (!user) {
      return {
        accessState: 'locked',
        isReady: !authLoading,
        isUnlocked: false,
        isPrivileged: false,
        hasSubscription: false,
      };
    }

    // If we have valid cache for this user, use it immediately
    if (cachedState) {
      const cachedUnlocked = cachedState.isAdmin || cachedState.isTeacher || cachedState.hasSubscription;
      return {
        accessState: cachedUnlocked ? 'unlocked' : 'locked',
        isReady: true, // Cache means we're ready instantly
        isUnlocked: cachedUnlocked,
        isPrivileged: cachedState.isAdmin || cachedState.isTeacher,
        hasSubscription: cachedState.hasSubscription,
      };
    }

    // No cache - check if still loading
    if (isLoading) {
      return {
        accessState: 'loading',
        isReady: false,
        isUnlocked: false,
        isPrivileged: false,
        hasSubscription: false,
      };
    }

    // Fresh data available
    return {
      accessState: isUnlocked ? 'unlocked' : 'locked',
      isReady: true,
      isUnlocked,
      isPrivileged,
      hasSubscription: hasActiveSubscription,
    };
  }, [user, cachedState, isLoading, isUnlocked, isPrivileged, hasActiveSubscription, authLoading]);

  return result;
};

/**
 * Clear access cache - call on logout or subscription change
 */
export const clearAccessCache = () => {
  SafeLocalStorage.remove(ACCESS_STATE_CACHE_KEY);
};
