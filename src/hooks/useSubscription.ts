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
    price: "$9.99/month",
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

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use React Query for caching subscription status
  const { data: subscription, isLoading, refetch } = useQuery<SubscriptionStatus>({
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
  });

  const checkSubscription = useCallback(async () => {
    await refetch();
  }, [refetch]);

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
    if (!subscription?.subscribed || !subscription?.price_id) return null;
    
    return Object.values(SUBSCRIPTION_TIERS).find(
      tier => tier.price_id === subscription.price_id
    );
  }, [subscription]);


  // Helper methods for checking specific premium features
  const canAccessHistoricalContent = useCallback(() => {
    return subscription?.subscribed && subscription?.subscription_end 
      ? new Date(subscription.subscription_end) > new Date() 
      : subscription?.subscribed || false;
  }, [subscription]);

  const canDownloadPDF = useCallback(() => {
    return subscription?.subscribed && subscription?.subscription_end 
      ? new Date(subscription.subscription_end) > new Date() 
      : subscription?.subscribed || false;
  }, [subscription]);

  const canAccessFullLibrary = useCallback(() => {
    return subscription?.subscribed && subscription?.subscription_end 
      ? new Date(subscription.subscription_end) > new Date() 
      : subscription?.subscribed || false;
  }, [subscription]);

  const subscriptionData: SubscriptionStatus = subscription || { subscribed: false, loading: false };

  return {
    ...subscriptionData,
    loading: isLoading,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    getSubscriptionTier,
    isSubscribed: subscriptionData.subscribed,
    hasActiveSubscription: subscriptionData.subscribed && subscriptionData.subscription_end 
      ? new Date(subscriptionData.subscription_end) > new Date() 
      : subscriptionData.subscribed,
    // Premium feature helpers
    canAccessHistoricalContent,
    canDownloadPDF,
    canAccessFullLibrary,
  };
};