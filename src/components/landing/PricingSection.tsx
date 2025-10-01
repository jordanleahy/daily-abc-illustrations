import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { useAuthContext } from '@/contexts/AuthContext';
import { useState } from 'react';

export const PricingSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { createCheckoutSession } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null);

  const handleCheckout = async (priceId: string, planType: 'monthly' | 'annual') => {
    if (!isAuthenticated) {
      // Redirect to auth with price details for post-auth checkout
      navigate(`/auth?mode=signup&priceId=${priceId}&planType=${planType}`);
      return;
    }

    setLoadingPlan(planType);
    try {
      await createCheckoutSession(priceId);
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    'Daily new ABC book at 7:01 AM ET',
    'Unlimited access to all books',
    'Learn to Earn for Kids Gamification',
    'Track progress and achievements',
    'Seasonal and relevant themes',
    'Cancel anytime'
  ];

  return (
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for your family
          </p>
        </div>

        {/* Two Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Monthly Card */}
          <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl mb-2">Monthly Plan</CardTitle>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">$9.99</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Billed monthly
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full text-lg py-6"
                size="lg"
                variant="outline"
                onClick={() => handleCheckout(SUBSCRIPTION_TIERS.standard_monthly.price_id, 'monthly')}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === 'monthly' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Get Started Now
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                30-day money-back guarantee • Cancel anytime
              </p>
            </CardContent>
          </Card>

          {/* Yearly Card - Highlighted */}
          <Card className="border-2 border-primary shadow-xl relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="px-4 py-1 text-sm">Save 75%</Badge>
            </div>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl mb-2">Yearly Plan</CardTitle>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">$2.50</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Billed $29.99 annually
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full text-lg py-6"
                size="lg"
                onClick={() => handleCheckout(SUBSCRIPTION_TIERS.standard_annual.price_id, 'annual')}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === 'annual' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Get Started Now
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                30-day money-back guarantee • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
