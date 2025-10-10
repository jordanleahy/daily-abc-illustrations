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
  cancel_at_period_end?: boolean;
  loading: boolean;
  error?: string;
}

// Define our subscription tiers with their corresponding Stripe IDs
export const SUBSCRIPTION_TIERS = {
  standard_monthly: {
    price_id: "price_1SFFx1C8085n0xWFN1fQ6B4N",
    product_id: "prod_T7a3qkxm69uttK",
    name: "Standard Monthly",
    price: 499, // Price in cents ($4.99)
    interval: "month"
  },
  standard_annual: {
    price_id: "price_1SBKvfC8Q85n0xWF1nxvGfau",
    product_id: "prod_T7a5vTweAt6UZm",
    name: "Standard Annual",
    price: 2999, // Price in cents ($29.99)
    interval: "year"
  }
} as const;

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use React Query for caching subscription status - always query fresh from Stripe API
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
          cancel_at_period_end: data.cancel_at_period_end,
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
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds (much shorter)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always check on mount
  });

  const effectiveLoading = query.isLoading;

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

  const updateAutoRenewal = useCallback(async (autoRenew: boolean) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to update your subscription",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('update-subscription-renewal', {
        body: { auto_renew: autoRenew }
      });

      if (error) throw error;

      // Refresh subscription status after update
      await query.refetch();

      toast({
        title: "Subscription Updated",
        description: autoRenew 
          ? "Your subscription will now renew automatically" 
          : "Your subscription will not renew at the end of the current period",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error updating subscription renewal:', error);
      toast({
        title: "Update Error",
        description: error instanceof Error ? error.message : 'Failed to update subscription',
        variant: "destructive",
      });
      return { success: false };
    }
  }, [user, toast, query]);

  const finalData: SubscriptionStatus = (query.data as SubscriptionStatus) || { subscribed: false, loading: false };

  return {
    ...finalData,
    loading: effectiveLoading,
    isRefreshing: query.isFetching,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    getSubscriptionTier,
    updateAutoRenewal,
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