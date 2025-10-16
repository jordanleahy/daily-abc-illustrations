import { useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';

/**
 * Feature access control hook for subscription-based features.
 * 
 * Determines which features a user can access based on:
 * - Their subscription tier (Basic vs Plus)
 * - Their role (Admin/Teacher bypass subscription checks)
 * - Authentication status
 * 
 * Features:
 * - habits_rewards: Access to habits, rewards, and coin earning (Plus tier only)
 * - library_access: Access to library books (All subscription tiers)
 */
export const useFeatureAccess = () => {
  const { user } = useAuthContext();
  const { hasRole } = useRole();
  const { product_id, hasActiveSubscription, loading } = useSubscription();
  
  // Admin/Teacher bypass all subscription checks
  const isPrivilegedUser = hasRole('admin') || hasRole('teacher');
  
  // Debug logging
  console.log('[FEATURE ACCESS] Debug:', {
    user_id: user?.id,
    product_id,
    hasActiveSubscription,
    isAdmin: hasRole('admin'),
    isTeacher: hasRole('teacher'),
    isPrivilegedUser,
  });
  
  /**
   * Check if user has access to Habits & Rewards features
   * Plus tier required (or privileged role)
   */
  const hasHabitsRewards = useMemo(() => {
    if (isPrivilegedUser) {
      console.log('[FEATURE ACCESS] User is privileged (admin/teacher) - granting habits_rewards access');
      return true;
    }
    if (!hasActiveSubscription) {
      console.log('[FEATURE ACCESS] No active subscription - denying habits_rewards access');
      return false;
    }
    
    // Check if product_id matches Plus tier
    const plusProductIds: string[] = [
      SUBSCRIPTION_TIERS.plus_monthly.product_id,
      SUBSCRIPTION_TIERS.plus_annual.product_id,
    ];
    
    const hasAccess = product_id ? plusProductIds.includes(product_id) : false;
    console.log('[FEATURE ACCESS] Checking product_id:', {
      product_id,
      plusProductIds,
      hasAccess,
    });
    
    return hasAccess;
  }, [product_id, hasActiveSubscription, isPrivilegedUser]);
  
  /**
   * Check if user has access to Library features
   * All subscription tiers get library access
   */
  const hasLibraryAccess = useMemo(() => {
    if (isPrivilegedUser) return true;
    return hasActiveSubscription; // All tiers get library
  }, [hasActiveSubscription, isPrivilegedUser]);
  
  /**
   * Get current subscription tier info
   */
  const currentTier = useMemo(() => {
    if (!product_id) return null;
    return Object.values(SUBSCRIPTION_TIERS).find(
      tier => tier.product_id === product_id
    );
  }, [product_id]);
  
  return {
    hasHabitsRewards,
    hasLibraryAccess,
    loading,
    currentTier,
    isPrivilegedUser,
  };
};
