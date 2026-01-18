import { useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Simplified useSubscription hook for free-tier-only model
 * 
 * All authenticated users get full access - no Stripe integration needed.
 * This hook maintains API compatibility for existing components.
 */

// Keep tier structure for potential future use, but not enforced
export const SUBSCRIPTION_TIERS = {
  free: {
    price_id: "",
    product_id: "",
    name: "Free",
    price: 0,
    interval: "forever",
    features: {
      library_access: true,
      habits_rewards: true,
    }
  },
} as const;

export const clearSubscriptionCache = () => {
  // No-op - no subscription caching needed
};

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuthContext();

  // All authenticated users have "active subscription" (free access)
  const hasActiveSubscription = !!user;

  // Stub functions for API compatibility
  const checkSubscription = useCallback(async () => {
    // No-op - all users have access
  }, []);

  const createCheckoutSession = useCallback(async (_price_id: string, _coupon_code?: string) => {
    // No-op - no checkout needed for free tier
    console.log('[SUBSCRIPTION] Checkout not needed - app is free');
  }, []);

  const openCustomerPortal = useCallback(async () => {
    // No-op - no portal needed for free tier
    console.log('[SUBSCRIPTION] Customer portal not needed - app is free');
  }, []);

  const getSubscriptionTier = useCallback(() => {
    return user ? SUBSCRIPTION_TIERS.free : null;
  }, [user]);

  const updateAutoRenewal = useCallback(async (_autoRenew: boolean) => {
    // No-op - no subscription to manage
    return { success: true };
  }, []);

  return {
    // All authenticated users are "subscribed"
    subscribed: hasActiveSubscription,
    product_id: user ? "free" : undefined,
    price_id: undefined,
    interval: "forever",
    subscription_end: undefined,
    cancel_at_period_end: false,
    error: undefined,
    
    // No trial system needed
    is_trial: false,
    trial_ends_at: undefined,
    isInTrial: false,
    daysLeftInTrial: 0,
    
    // State
    loading: authLoading,
    isRefreshing: false,
    isOpeningCheckout: false,
    
    // All authenticated users have access
    hasActiveSubscription,
    
    // Actions (stubs for compatibility)
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    getSubscriptionTier,
    updateAutoRenewal,
  };
};
