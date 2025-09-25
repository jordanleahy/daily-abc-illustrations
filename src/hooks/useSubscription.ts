import { useState, useEffect, useCallback } from 'react';
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
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    loading: false,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ subscribed: false, loading: false });
      return;
    }

    setSubscription(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) throw error;

      setSubscription({
        subscribed: data.subscribed || false,
        product_id: data.product_id,
        price_id: data.price_id,
        interval: data.interval,
        subscription_end: data.subscription_end,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({
        subscribed: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check subscription',
      });
    }
  }, [user]);

  const createCheckoutSession = useCallback(async (price_id: string) => {
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
        body: { price_id }
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
    if (!subscription.subscribed || !subscription.price_id) return null;
    
    return Object.values(SUBSCRIPTION_TIERS).find(
      tier => tier.price_id === subscription.price_id
    );
  }, [subscription.subscribed, subscription.price_id]);

  // Check subscription on mount and when user changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh subscription every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    ...subscription,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    getSubscriptionTier,
    isSubscribed: subscription.subscribed,
    hasActiveSubscription: subscription.subscribed && subscription.subscription_end 
      ? new Date(subscription.subscription_end) > new Date() 
      : subscription.subscribed,
  };
};