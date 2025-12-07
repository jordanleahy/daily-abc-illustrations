import { useMemo } from 'react';
import { useAccessResolver } from '@/hooks/useAccessResolver';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';

/**
 * Feature access control hook for subscription-based features.
 * 
 * Delegates core access resolution to useAccessResolver for consistency.
 * Adds feature-specific logic for habits vs library access.
 * 
 * Features:
 * - habits_rewards: Access to habits, rewards, and coin earning (Plus tier only)
 * - library_access: Access to library books (All subscription tiers)
 */
export const useFeatureAccess = () => {
  const { isReady, isUnlocked, isPrivileged, hasSubscription } = useAccessResolver();
  const { product_id } = useSubscription();
  
  /**
   * Check if user has access to Habits & Rewards features
   * Plus tier required (or privileged role)
   */
  const hasHabitsRewards = useMemo(() => {
    if (isPrivileged) return true;
    if (!hasSubscription) return false;
    
    // Check if product_id matches Plus tier
    const plusProductIds: string[] = [
      SUBSCRIPTION_TIERS.plus_monthly.product_id,
      SUBSCRIPTION_TIERS.plus_annual.product_id,
    ];
    
    return product_id ? plusProductIds.includes(product_id) : false;
  }, [product_id, hasSubscription, isPrivileged]);
  
  /**
   * Check if user has access to Library features
   * Requires active subscription (any tier) or privileged role
   */
  const hasLibraryAccess = useMemo(() => {
    // Delegated to useAccessResolver - isUnlocked already handles this
    return isUnlocked;
  }, [isUnlocked]);
  
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
    loading: !isReady,
    currentTier,
    isPrivilegedUser: isPrivileged,
  };
};
