import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';

const SubscriptionCheckout = () => {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const plan = searchParams.get('plan') || 'annual';
  const coupon = searchParams.get('coupon');

  useEffect(() => {
    // Wait for auth to complete
    if (authLoading) return;

    // Redirect to auth if not authenticated
    if (!isAuthenticated) {
      const redirectUrl = `/auth?mode=signup&redirect=/subscription/checkout&plan=${plan}${coupon ? `&coupon=${coupon}` : ''}`;
      navigate(redirectUrl);
      return;
    }

    // Start checkout process
    const startCheckout = async () => {
      try {
        setStatus('redirecting');

        // Get the appropriate price ID based on plan
        const priceId = plan === 'monthly' 
          ? SUBSCRIPTION_TIERS.plus_monthly.price_id 
          : SUBSCRIPTION_TIERS.plus_annual.price_id;

        // Call create-checkout with coupon if provided
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { 
            price_id: priceId,
            coupon_code: coupon || undefined
          }
        });

        if (error) throw error;

        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (err) {
        console.error('Checkout error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to start checkout');
      }
    };

    startCheckout();
  }, [authLoading, isAuthenticated, navigate, plan, coupon]);

  return (
    <PageLayout>
      <Container size="sm" className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {status === 'error' ? (
                <span className="text-2xl">⚠️</span>
              ) : (
                <Sparkles className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === 'error' ? 'Checkout Error' : 'Preparing Your Subscription'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Verifying your account...'}
              {status === 'redirecting' && (
                <>
                  Redirecting to secure checkout
                  {coupon && <span className="block mt-1 text-primary font-medium">Coupon: {coupon}</span>}
                </>
              )}
              {status === 'error' && errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {status !== 'error' && (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            )}
          </CardContent>
        </Card>
      </Container>
    </PageLayout>
  );
};

export default SubscriptionCheckout;
