import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook that enforces subscription requirement for authenticated users
 * Automatically redirects to Stripe checkout if no active subscription
 */
export const useSubscriptionGate = () => {
  const { user, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Skip if auth is still loading or no user
    if (authLoading || !user) return;

    // Skip check on these routes (they don't require subscription)
    const publicRoutes = ['/auth', '/auth/confirm', '/pricing', '/'];
    if (publicRoutes.includes(location.pathname)) return;

    const checkAndRedirect = async () => {
      try {
        setChecking(true);
        console.log('[SUBSCRIPTION-GATE] Checking subscription for user:', user.email);
        
        const { data: subscriptionData, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('[SUBSCRIPTION-GATE] Error checking subscription:', error);
          return;
        }

        console.log('[SUBSCRIPTION-GATE] Subscription data:', subscriptionData);

        const hasActiveSubscription = subscriptionData?.subscribed && 
          (!subscriptionData.subscription_end || new Date(subscriptionData.subscription_end) > new Date());

        if (!hasActiveSubscription) {
          console.log('[SUBSCRIPTION-GATE] No active subscription, redirecting to pricing');
          navigate('/pricing', { replace: true });
        } else {
          console.log('[SUBSCRIPTION-GATE] Active subscription found');
        }
      } catch (error) {
        console.error('[SUBSCRIPTION-GATE] Unexpected error:', error);
      } finally {
        setChecking(false);
      }
    };

    checkAndRedirect();
  }, [user, authLoading, location.pathname, navigate]);

  return { checking };
};
