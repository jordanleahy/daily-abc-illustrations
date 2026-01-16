import { useCallback, useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SafeLocalStorage, SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_CACHE_DAYS, ACCESS_STATE_CACHE_KEY } from '@/utils/storage';

// Global singleton state - prevents ALL concurrent API calls across all hook instances
let pendingRequest: Promise<SubscriptionStatus> | null = null;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 30000; // 30 seconds minimum between API calls
let lastCacheResult: SubscriptionStatus | null = null;
let lastCacheTime = 0;
const MEMORY_CACHE_TTL = 60000; // 1 minute in-memory cache

// Module-level flags 
let globalMountCheckDone = false;
let globalLastFocusCheck = 0;
let realtimeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

interface SubscriptionStatus {
  subscribed: boolean;
  product_id?: string;
  price_id?: string;
  interval?: string;
  subscription_end?: string;
  cancel_at_period_end?: boolean;
  is_trial?: boolean;
  trial_ends_at?: string;
  loading: boolean;
  error?: string;
}

export const SUBSCRIPTION_TIERS = {
  plus_monthly: {
    price_id: "price_1SV26WC8Q85n0xWFQYibK0Jg",
    product_id: "prod_T7a3qkxm69uttK",
    name: "Plus Monthly",
    price: 1499,
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
    price: 9900,
    interval: "year",
    features: {
      library_access: true,
      habits_rewards: true,
    }
  }
} as const;

// Helper to check if subscription is active
const isSubscriptionActive = (status: SubscriptionStatus): boolean => {
  if (status.is_trial && status.trial_ends_at) {
    return new Date(status.trial_ends_at) > new Date();
  }
  if (!status.subscribed) return false;
  if (status.subscription_end) {
    return new Date(status.subscription_end) > new Date();
  }
  return status.subscribed;
};

const getUserCacheKey = (userId: string) => `${SUBSCRIPTION_CACHE_KEY}_${userId}`;

// Singleton fetch function with aggressive deduplication
const fetchSubscription = async (userId: string): Promise<SubscriptionStatus> => {
  // 1. Check in-memory cache first (fastest)
  const now = Date.now();
  if (lastCacheResult && (now - lastCacheTime) < MEMORY_CACHE_TTL) {
    console.log('[SUBSCRIPTION] Using in-memory cache');
    return { ...lastCacheResult, loading: false };
  }

  // 2. Check localStorage cache
  const userCacheKey = getUserCacheKey(userId);
  const cached = SafeLocalStorage.get<SubscriptionStatus>(userCacheKey);
  if (cached) {
    console.log('[SUBSCRIPTION] Using localStorage cached data for user', userId);
    lastCacheResult = cached;
    lastCacheTime = now;
    return { ...cached, loading: false };
  }

  // 3. If there's already a pending request, wait for it
  if (pendingRequest) {
    console.log('[SUBSCRIPTION] Request already in progress, waiting...');
    return pendingRequest;
  }

  // 4. Enforce minimum time between API requests
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL && lastCacheResult) {
    console.log('[SUBSCRIPTION] Rate limiting - returning last known result');
    return { ...lastCacheResult, loading: false };
  }

  // 5. Create the actual request
  pendingRequest = (async () => {
    try {
      console.log('[SUBSCRIPTION] Fetching fresh subscription from API for user', userId);
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
        is_trial: data.is_trial || false,
        trial_ends_at: data.trial_ends_at,
        loading: false,
      };

      // Update both caches
      SafeLocalStorage.set(userCacheKey, subscriptionData, 90 * 24);
      lastCacheResult = subscriptionData;
      lastCacheTime = Date.now();

      return subscriptionData;
    } catch (error) {
      console.error('Error checking subscription:', error);
      // On error, return last known good result if available
      if (lastCacheResult) {
        return { ...lastCacheResult, loading: false };
      }
      return {
        subscribed: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      };
    } finally {
      pendingRequest = null;
    }
  })();

  return pendingRequest;
};

export const clearSubscriptionCache = (userId?: string) => {
  if (userId) {
    SafeLocalStorage.remove(getUserCacheKey(userId));
  }
  SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
  // Don't clear in-memory cache to prevent immediate re-fetch storms
};

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuthContext();

  // Use React Query with strict deduplication - queryFn just calls singleton
  const query = useQuery<SubscriptionStatus>({
    queryKey: ['subscription', user?.id],
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    networkMode: 'online',
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!user) {
        clearSubscriptionCache();
        return { subscribed: false, loading: false };
      }
      return fetchSubscription(user.id);
    },
    enabled: !!user,
    staleTime: SUBSCRIPTION_CACHE_DAYS * 24 * 60 * 60 * 1000,
    gcTime: SUBSCRIPTION_CACHE_DAYS * 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    // IMPORTANT: Refetch on mount if no data exists to ensure fresh users get subscription check
    refetchOnMount: (query) => query.state.data === undefined ? 'always' : false,
    refetchOnReconnect: false,
  });

  const effectiveLoading = authLoading || query.isLoading;

  const checkSubscription = useCallback(async () => {
    // Clear cache to force fresh API call
    console.log('[SUBSCRIPTION] Manual check triggered - clearing cache');
    clearSubscriptionCache(user?.id);
    await query.refetch();
  }, [query, user?.id]);

  // Listen for auth-driven subscription checks - with debounce
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    const handleAuthCheck = () => {
      // Debounce auth checks to prevent storm
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('[SUBSCRIPTION] Auth-triggered check (debounced)');
        query.refetch();
      }, 1000);
    };

    window.addEventListener('auth-subscription-check', handleAuthCheck);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('auth-subscription-check', handleAuthCheck);
    };
  }, [query]);

  // Real-time subscription to user_subscription_cache table - with heavy debounce
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user?.id) return;

    console.log('[SUBSCRIPTION] Setting up real-time subscription for user:', user.id);
    
    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscription_cache',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[SUBSCRIPTION] Real-time update received');
          // Debounce real-time updates to prevent storm
          if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
          realtimeDebounceTimer = setTimeout(() => {
            console.log('[SUBSCRIPTION] Processing real-time update (debounced)');
            SafeLocalStorage.remove(ACCESS_STATE_CACHE_KEY);
            // Don't clear subscription cache - just invalidate query
            // The query will use in-memory cache if recent
            queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
          }, 2000); // 2 second debounce
        }
      )
      .subscribe();

    return () => {
      console.log('[SUBSCRIPTION] Cleaning up real-time subscription');
      if (realtimeDebounceTimer) clearTimeout(realtimeDebounceTimer);
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Refresh subscription when returning from Stripe checkout (window focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const now = Date.now();
        // Only check if more than 30 seconds since last global check (strong debounce)
        if (now - globalLastFocusCheck > 30000) {
          globalLastFocusCheck = now;
          
          // Check URL for checkout success indicator
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('checkout_success') || urlParams.has('session_id')) {
            console.log('[SUBSCRIPTION] Post-checkout refresh triggered');
            clearSubscriptionCache(user.id);
            query.refetch();
            // Clean up URL params
            urlParams.delete('checkout_success');
            urlParams.delete('session_id');
            const newUrl = urlParams.toString() 
              ? `${window.location.pathname}?${urlParams.toString()}`
              : window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Only check on mount ONCE globally across all component instances
    if (!globalMountCheckDone) {
      globalMountCheckDone = true;
      // Delay check to let React Query settle first
      const timer = setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('checkout_success') || urlParams.has('session_id')) {
          handleVisibilityChange();
        }
      }, 1000);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
    
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, query]);

  const { toast } = useToast();

  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  const createCheckoutSession = useCallback(async (price_id: string, coupon_code?: string) => {
    // Wait for auth to be ready - don't show error if still loading
    if (authLoading) {
      console.log('[SUBSCRIPTION] Auth still loading, waiting...');
      return;
    }
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      return;
    }

    setIsOpeningCheckout(true);

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
        } else {
          // Successfully opened in new tab, hide overlay after a moment
          setTimeout(() => setIsOpeningCheckout(false), 1500);
        }
      } else {
        setIsOpeningCheckout(false);
        toast({
          title: "Checkout unavailable",
          description: "Unable to start checkout. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsOpeningCheckout(false);
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: "destructive",
      });
    }
  }, [user, authLoading, toast]);

  const openCustomerPortal = useCallback(async () => {
    // Wait for auth to be ready
    if (authLoading) {
      console.log('[SUBSCRIPTION] Auth still loading, waiting...');
      return;
    }
    
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
  }, [user, authLoading, toast]);

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
      clearSubscriptionCache(user.id);
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

  // Calculate trial days remaining
  const isInTrial = finalData.is_trial && finalData.trial_ends_at && new Date(finalData.trial_ends_at) > new Date();
  const daysLeftInTrial = isInTrial && finalData.trial_ends_at
    ? Math.ceil((new Date(finalData.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    // Raw subscription data
    subscribed: finalData.subscribed,
    product_id: finalData.product_id,
    price_id: finalData.price_id,
    interval: finalData.interval,
    subscription_end: finalData.subscription_end,
    cancel_at_period_end: finalData.cancel_at_period_end,
    error: finalData.error,
    
    // Trial data
    is_trial: finalData.is_trial,
    trial_ends_at: finalData.trial_ends_at,
    isInTrial,
    daysLeftInTrial,
    
    // State
    loading: effectiveLoading,
    isRefreshing: query.isFetching,
    isOpeningCheckout,
    
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