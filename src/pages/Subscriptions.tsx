import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Test Subscription Page - For testing real Stripe checkout flow
 * Navigate to /subscriptions while logged in to test
 */

// Stripe product/price configuration
const SUBSCRIPTION_PLANS: Record<string, {
  name: string;
  price: string;
  priceId: string;
  productId: string;
  savings?: string;
  features: string[];
}> = {
  monthly: {
    name: 'Standard - Monthly',
    price: '$14.99/month',
    priceId: 'price_1SV26WC8Q85n0xWFQYibK0Jg',
    productId: 'prod_T7a3qkxm69uttK',
    features: [
      'Access to all daily published ABC books',
      'Download PDF versions',
      'Full library access',
      'Habits & Rewards system',
    ],
  },
  annual: {
    name: 'Standard - Annual',
    price: '$99.99/year',
    priceId: 'price_1SEEd8C8Q85n0xWFLL92SUJy',
    productId: 'prod_T7a5vTweAt6UZm',
    savings: 'Save 44%',
    features: [
      'Everything in Monthly',
      'Priority support',
      'Annual savings',
    ],
  },
};

// One-time purchase products
const ONE_TIME_PRODUCTS: Record<string, {
  name: string;
  price: string;
  priceId: string;
  productId: string;
  features: string[];
}> = {
  max: {
    name: 'Max',
    price: '$500',
    priceId: 'price_1SwVN2C8Q85n0xWFGu9cmPHV',
    productId: 'prod_TuK1PC63uRuok9',
    features: [
      'One-time purchase',
      'Lifetime access',
    ],
  },
};

export default function Subscriptions() {
  const { user, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  const handleCheckout = async (planType: 'monthly' | 'annual' | 'max') => {
    if (!isAuthenticated) {
      toast.error('Please log in first');
      navigate('/auth');
      return;
    }

    setLoadingPlan(planType);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          plan_type: planType,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to create checkout session');
        return;
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast.success('Stripe checkout opened in new tab');
      } else {
        toast.error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Something went wrong');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCheckSubscription = async () => {
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Check subscription error:', error);
        toast.error('Failed to check subscription');
        return;
      }

      setSubscriptionStatus(data);
      toast.success('Subscription status fetched');
    } catch (err) {
      console.error('Check subscription error:', err);
      toast.error('Something went wrong');
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleOpenPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        console.error('Portal error:', error);
        toast.error('Failed to open customer portal');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Customer portal opened');
      }
    } catch (err) {
      console.error('Portal error:', err);
      toast.error('Something went wrong');
    }
  };

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <Container size="sm" className="py-12">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to test subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            </CardContent>
          </Card>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container size="lg" className="py-12">
        {/* Warning Banner */}
        <Card className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Test Mode</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This page is for testing Stripe subscriptions. Use Stripe test cards (e.g., 4242 4242 4242 4242).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current User Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCheckSubscription}
                disabled={checkingSubscription}
              >
                {checkingSubscription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check Subscription Status
              </Button>
              
              <Button variant="outline" onClick={handleOpenPortal}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Customer Portal
              </Button>
            </div>

            {subscriptionStatus && (
              <Card className="mt-4 bg-muted/50">
                <CardContent className="pt-4">
                  <p className="font-medium mb-2">Subscription Status:</p>
                  <pre className="text-xs bg-background p-3 rounded overflow-auto">
                    {JSON.stringify(subscriptionStatus, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
            <Card key={key} className="relative">
              {plan.savings && (
                <Badge className="absolute -top-3 right-4 bg-green-500">
                  {plan.savings}
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  {plan.price}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Price ID: {plan.priceId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Product ID: {plan.productId}
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handleCheckout(key as 'monthly' | 'annual')}
                  disabled={loadingPlan === key}
                >
                  {loadingPlan === key && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Subscribe to {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* One-Time Products */}
        <h2 className="text-2xl font-bold mb-6 mt-12">One-Time Purchases</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(ONE_TIME_PRODUCTS).map(([key, product]) => (
            <Card key={key} className="relative">
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">
                  {product.price}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {product.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Price ID: {product.priceId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Product ID: {product.productId}
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => handleCheckout(key as 'monthly' | 'annual' | 'max')}
                  disabled={loadingPlan === key}
                >
                  {loadingPlan === key && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Purchase {product.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Card Info */}
        <Card className="mt-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Test Card Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><code className="bg-background px-2 py-1 rounded">4242 4242 4242 4242</code> - Successful payment</p>
            <p><code className="bg-background px-2 py-1 rounded">4000 0000 0000 3220</code> - 3D Secure authentication</p>
            <p><code className="bg-background px-2 py-1 rounded">4000 0000 0000 9995</code> - Declined payment</p>
            <p className="text-muted-foreground mt-2">Use any future expiry date and any 3-digit CVC.</p>
          </CardContent>
        </Card>
      </Container>
    </PageLayout>
  );
}
