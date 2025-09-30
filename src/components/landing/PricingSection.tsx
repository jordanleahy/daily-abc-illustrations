import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PricingSection = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const navigate = useNavigate();

  const monthlyPrice = 9.99;
  const yearlyPrice = 99.99;
  const yearlyMonthlyEquivalent = (yearlyPrice / 12).toFixed(2);

  const features = [
    'Daily new ABC book at 7:01 AM ET',
    'Educational phonics-focused content',
    'Earn money system (1 page = 1 penny)',
    'Track progress and achievements',
    'High-quality AI illustrations',
    'Seasonal and relevant themes',
    'Unlimited access to all books',
    'Cancel anytime'
  ];

  return (
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that works best for your family
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'yearly'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-primary shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl mb-2">Premium Access</CardTitle>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">
                    ${billingPeriod === 'monthly' ? monthlyPrice : yearlyMonthlyEquivalent}
                  </span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Billed ${yearlyPrice} annually
                  </p>
                )}
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
                onClick={() => navigate('/auth')}
              >
                Start Your Free Trial
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                7-day free trial • Cancel anytime • No commitments
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
