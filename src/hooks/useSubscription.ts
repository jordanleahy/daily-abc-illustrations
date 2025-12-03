import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SafeLocalStorage, SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_CACHE_DAYS } from '@/utils/storage';

// Global request lock to prevent concurrent API calls
let pendingRequest: Promise<SubscriptionStatus> | null = null;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between requests

interface SubscriptionStatus {
  subscribed: boolean;
  product_id?: string;
  price_id?: string;
  interval?: string;
  subscription_end?: string;
  cancel_at_period_end?: boolean;
  loading: boolean;
  error?: string;
}

// Define our subscription tiers with their corresponding Stripe IDs
export const SUBSCRIPTION_TIERS = {
  // Plus tier - Full features (habits + rewards + library)
  // These are the existing products, now labeled as "Plus"
  plus_monthly: {
    price_id: "price_1SV26WC8Q85n0xWFQYibK0Jg",
    product_id: "prod_T7a3qkxm69uttK",
    name: "Plus Monthly",
    price: 1499, // Price in cents ($14.99)
    interval: "month",
    features: {
      library_access: true,
      habits_rewards: true,
    }
  },
  plus_annual: {
    price_id: "price_1SEEd8C8Q85n0xWFLL92SUJy",
    product_id: "prod_T7a5vTweAt6UZm",
    name: "Plus Annual",
    price: 9900, // Price in cents ($99.00)
    interval: "year",
    features: {
      library_access: true,
      habits_rewards: true,
    }
  }
  // Note: Basic tier to be added when Stripe products are created
  // basic_monthly: {
  //   price_id: "price_xxx",
  //   product_id: "prod_xxx",
  //   name: "Basic Monthly",
  //   price: 299, // $2.99
  //   interval: "month",
  //   features: {
  //     library_access: true,
  //     habits_rewards: false,
  //   }
  // }
} as const;

// Helper to check if subscription is active
const isSubscriptionActive = (status: SubscriptionStatus): boolean => {
  if (!status.subscribed) return false;
  
  // If subscription_end exists, check if it's in the future
  if (status.subscription_end) {
    return new Date(status.subscription_end) > new Date();
  }
  
  // If no subscription_end, use subscribed status
  return status.subscribed;
};

export const useSubscription = () => {
  const { user } = useAuthContext();

  // Use React Query with 90-day localStorage caching + strict deduplication
  const query = useQuery<SubscriptionStatus>({
    queryKey: ['subscription', user?.id],
    // CRITICAL: Ensure only ONE request happens across all components
    queryKeyHashFn: (queryKey) => JSON.stringify(queryKey),
    retry: 3, // Retry 3 times on connection errors
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    networkMode: 'online', // Only fetch when online
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!user) {
        SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
        return { subscribed: false, loading: false };
      }

      // Check 90-day cache first
      const cached = SafeLocalStorage.get<SubscriptionStatus>(SUBSCRIPTION_CACHE_KEY);
      if (cached) {
        console.log('[SUBSCRIPTION] Using 90-day cached data');
        return { ...cached, loading: false };
      }

      // If there's already a pending request, wait for it
      if (pendingRequest) {
        console.log('[SUBSCRIPTION] Request already in progress, waiting...');
        return pendingRequest;
      }

      // Enforce minimum time between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`[SUBSCRIPTION] Rate limiting - waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Create and store the pending request
      pendingRequest = (async () => {
        try {
          console.log('[SUBSCRIPTION] Fetching fresh subscription from API');
          lastRequestTime = Date.now();
          
          const { data, error } = await supabase.functions.invoke('check-subscription');
          if (error) throw error;

          const subscriptionData: SubscriptionStatus = {
            subscribed: data.subscribed || false,
            product_id: data.product_id,
            price_id: data.price_id,
            interval: data.interval,
            subscription_end: data.subscription_end,
            cancel_at_period_end: data.cancel_at_period_end,
            loading: false,
          };

          // Cache for 90 days - instant loads for game app users
          SafeLocalStorage.set(
            SUBSCRIPTION_CACHE_KEY,
            subscriptionData,
            90 * 24
          );

          return subscriptionData;
        } catch (error) {
          console.error('Error checking subscription:', error);
          SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
          return {
            subscribed: false,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to check subscription',
          };
        } finally {
          // Clear the pending request after completion
          pendingRequest = null;
        }
      })();

      return pendingRequest;
    },
    enabled: !!user,
    staleTime: SUBSCRIPTION_CACHE_DAYS * 24 * 60 * 60 * 1000, // 30 days in ms
    gcTime: SUBSCRIPTION_CACHE_DAYS * 24 * 60 * 60 * 1000, // 30 days in ms
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Don't refetch on mount - use cache
  });

  const effectiveLoading = query.isLoading;

  const checkSubscription = useCallback(async () => {
    // Clear cache to force fresh API call
    console.log('[SUBSCRIPTION] Manual check triggered - clearing cache');
    SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
    await query.refetch();
  }, [query]);

  // Listen for auth-driven subscription checks
  useEffect(() => {
    const handleAuthCheck = () => {
      console.log('[SUBSCRIPTION] Auth-triggered check - clearing cache and refetching');
      SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
      query.refetch();
    };

    window.addEventListener('auth-subscription-check', handleAuthCheck);
    return () => window.removeEventListener('auth-subscription-check', handleAuthCheck);
  }, [query]);

  const { toast } = useToast();

  const createCheckoutSession = useCallback(async (price_id: string, coupon_code?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { price_id, coupon_code }
      });

      if (error) throw error;

      if (data.url) {
        // Try to open checkout in new tab, fall back to same window if blocked
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked, redirect in same window
          window.location.href = data.url;
        }
      } else {
        toast({
          title: "Checkout unavailable",
          description: "Unable to start checkout. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to manage your subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data.url) {
        // Try to open portal in new tab, fall back to same window if blocked
        const newWindow = window.open(data.url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Portal unavailable",
        description: error instanceof Error ? error.message : 'Failed to open customer portal',
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Get subscription tier info
  const getSubscriptionTier = useCallback(() => {
    const s = query.data as SubscriptionStatus | undefined;
    if (!s?.subscribed || !s?.price_id) return null;
    return Object.values(SUBSCRIPTION_TIERS).find(
      tier => tier.price_id === s.price_id
    );
  }, [query.data]);

  const updateAutoRenewal = useCallback(async (autoRenew: boolean) => {
    if (!user) {
      console.error("Please sign in to update your subscription");
      return { success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('update-subscription-renewal', {
        body: { auto_renew: autoRenew }
      });

      if (error) throw error;

      // Clear cache and refresh subscription status after update
      SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
      await query.refetch();

      console.log(autoRenew 
        ? "Your subscription will now renew automatically" 
        : "Your subscription will not renew at the end of the current period");

      return { success: true, data };
    } catch (error) {
      console.error('Error updating subscription renewal:', error);
      console.error(error instanceof Error ? error.message : 'Failed to update subscription');
      return { success: false };
    }
  }, [user, query]);

  const finalData: SubscriptionStatus = (query.data as SubscriptionStatus) || { subscribed: false, loading: false };

  return {
    // Raw subscription data
    subscribed: finalData.subscribed,
    product_id: finalData.product_id,
    price_id: finalData.price_id,
    interval: finalData.interval,
    subscription_end: finalData.subscription_end,
    cancel_at_period_end: finalData.cancel_at_period_end,
    error: finalData.error,
    
    // State
    loading: effectiveLoading,
    isRefreshing: query.isFetching,
    
    // Single source of truth for subscription status
    hasActiveSubscription: isSubscriptionActive(finalData),
    
    // Actions
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    getSubscriptionTier,
    updateAutoRenewal,
  };
};