import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const NonAuthPricingSection = () => {
  const handleUpgrade = (planType: 'monthly' | 'annual') => {
    // Placeholder for guest checkout functionality
    console.log(`Upgrade to ${planType} plan`);
  };

  const freeFeatures = [
    'View daily published content',
    'Limited access to features',
    'Basic AI interactions'
  ];

  const premiumFeatures = [
    'Unlimited book creation',
    'Advanced AI features',
    'Export to PDF',
    'Priority support',
    'Custom illustrations',
    'Detailed analytics'
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12">
      {/* Current Plan Status */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Start with our free plan or upgrade for premium features
        </p>
        
        {/* Free Plan Card */}
        <Card className="max-w-md mx-auto mb-8 border-2 border-muted">
          <CardHeader>
            <CardTitle className="text-xl">Free Plan</CardTitle>
            <CardDescription>Your current plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
            <ul className="space-y-2 text-sm">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Premium Plans */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Monthly Plan */}
        <Card className="relative border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Standard Monthly
            </CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-6">
              $9.99<span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-6">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleUpgrade('monthly')}
            >
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>

        {/* Annual Plan */}
        <Card className="relative border-2 border-primary shadow-lg">
          <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
            <Star className="h-3 w-3 mr-1" />
            Save 75%
          </Badge>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Standard Annual
            </CardTitle>
            <CardDescription>Best value - save $89.88 per year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              $29.99<span className="text-sm font-normal text-muted-foreground">/year</span>
            </div>
            <div className="text-sm text-muted-foreground mb-6">
              <span className="line-through">$119.88</span> - You save $89.88
            </div>
            <ul className="space-y-3 mb-6">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleUpgrade('annual')}
            >
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="text-center mt-12">
        <h3 className="text-2xl font-semibold mb-4">Why Upgrade to Premium?</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Unlimited Creation</h4>
            <p className="text-sm text-muted-foreground">Create as many ABC books as you want with no restrictions</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-success" />
            </div>
            <h4 className="font-semibold mb-2">Advanced Features</h4>
            <p className="text-sm text-muted-foreground">Access powerful AI tools and export capabilities</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-success" />
            </div>
            <h4 className="font-semibold mb-2">Priority Support</h4>
            <p className="text-sm text-muted-foreground">Get help when you need it with dedicated support</p>
          </div>
        </div>
      </div>
    </div>
  );
};