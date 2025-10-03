import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatus {
  subscribed: boolean;
  product_id?: string;
  price_id?: string;
  interval?: string;
  subscription_end?: string;
  loading: boolean;
  error?: string;
}

// Define our subscription tiers with their corresponding Stripe IDs
export const SUBSCRIPTION_TIERS = {
  standard_monthly: {
    price_id: "price_1SBKtlC8Q85n0xWFlMZa2qdZ",
    product_id: "prod_T7a3qkxm69uttK",
    name: "Standard Monthly",
    price: "$19.99/month",
    interval: "month"
  },
  standard_annual: {
    price_id: "price_1SBKvfC8Q85n0xWF1nxvGfau",
    product_id: "prod_T7a5vTweAt6UZm",
    name: "Standard Annual",
    price: "$29.99/year",
    interval: "year"
  }
} as const;

const SUBSCRIPTION_CACHE_KEY = 'subscription-status-v1';

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Read cached subscription from localStorage for instant, no-jump UI
  let initialData: SubscriptionStatus | undefined = undefined;
  let initialUpdatedAt: number | undefined = undefined;
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const { subscribed, product_id, price_id, interval, subscription_end, updatedAt } = parsed as any;
        initialData = {
          subscribed: !!subscribed,
          product_id,
          price_id,
          interval,
          subscription_end,
          loading: false,
        };
        initialUpdatedAt = typeof updatedAt === 'number' ? updatedAt : Date.now();
      }
    }
  } catch (_) {
    // ignore cache errors
  }

  // Use React Query for caching subscription status
  const query = useQuery<SubscriptionStatus>({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (!user) {
        return {
          subscribed: false,
          loading: false,
        };
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');

        if (error) throw error;

        return {
          subscribed: data.subscribed || false,
          product_id: data.product_id,
          price_id: data.price_id,
          interval: data.interval,
          subscription_end: data.subscription_end,
          loading: false,
        };
      } catch (error) {
        console.error('Error checking subscription:', error);
        return {
          subscribed: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to check subscription',
        };
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (formerly cacheTime)
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    placeholderData: initialData, // Show cached data instantly while refetching
    initialData,
    initialDataUpdatedAt: initialUpdatedAt,
  });

  // Cache subscription data to localStorage whenever it updates
  const subscriptionData = query.data;
  if (subscriptionData && !query.isLoading) {
    try {
      localStorage.setItem(
        SUBSCRIPTION_CACHE_KEY,
        JSON.stringify({ ...subscriptionData, updatedAt: Date.now() })
      );
    } catch (_) {
      // ignore cache errors
    }
  }

  const effectiveLoading = query.isLoading && !initialData;

  const checkSubscription = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const createCheckoutSession = useCallback(async (price_id: string, coupon_code?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
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
        // Open checkout in new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your subscription",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data.url) {
        // Open portal in new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Portal Error",
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


  // Helper methods for checking specific premium features
  const canAccessHistoricalContent = useCallback(() => {
    const s = query.data as SubscriptionStatus | undefined;
    return s?.subscribed && s?.subscription_end 
      ? new Date(s.subscription_end) > new Date() 
      : s?.subscribed || false;
  }, [query.data]);

  const canDownloadPDF = useCallback(() => {
    const s = query.data as SubscriptionStatus | undefined;
    return s?.subscribed && s?.subscription_end 
      ? new Date(s.subscription_end) > new Date() 
      : s?.subscribed || false;
  }, [query.data]);

  const canAccessFullLibrary = useCallback(() => {
    const s = query.data as SubscriptionStatus | undefined;
    return s?.subscribed && s?.subscription_end 
      ? new Date(s.subscription_end) > new Date() 
      : s?.subscribed || false;
  }, [query.data]);

  const finalData: SubscriptionStatus = (query.data as SubscriptionStatus) || { subscribed: false, loading: false };

  return {
    ...finalData,
    loading: effectiveLoading,
    isRefreshing: query.isFetching,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    getSubscriptionTier,
    isSubscribed: finalData.subscribed,
    hasActiveSubscription: finalData.subscribed && finalData.subscription_end 
      ? new Date(finalData.subscription_end) > new Date() 
      : finalData.subscribed,
    // Premium feature helpers
    canAccessHistoricalContent,
    canDownloadPDF,
    canAccessFullLibrary,
  };
};