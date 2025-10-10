import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export const NonAuthPricingSection = () => {
  const navigate = useNavigate();

  const handleSelectPlan = () => {
    navigate('/auth?mode=signup');
  };

  const freeFeatures = [
    'View today\'s ABC book',
    'Limited daily access',
    'Basic reading experience'
  ];

  const monthlyFeatures = [
    'Access to all daily published ABC books',
    'Download PDF version',
    'Full library access',
    'Premium reading experience'
  ];

  const annualFeatures = [
    'Access to all daily published ABC books',
    'Download PDF version',
    'Full library access',
    'Premium reading experience',
    'Early access to new books',
    'Educational activity guides'
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground">
          Select the plan that works best for you
        </p>
      </div>

      {/* Three Column Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Plan */}
        <Card className="border">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl mb-4">Free</CardTitle>
            <div className="text-5xl font-bold mb-2">$0</div>
            <div className="text-muted-foreground">forever</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-4">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Monthly Plan */}
        <Card className="border">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl mb-4">Monthly</CardTitle>
            <div className="text-5xl font-bold mb-2">$4.99</div>
            <div className="text-muted-foreground">per month</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-4">
              {monthlyFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              onClick={handleSelectPlan}
            >
              Select Monthly
            </Button>
          </CardContent>
        </Card>

        {/* Annual Plan */}
        <Card className="border">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl mb-4">Annual</CardTitle>
            <div className="text-5xl font-bold mb-2">$29.99</div>
            <div className="text-muted-foreground mb-1">per year</div>
            <div className="text-green-600 font-semibold text-sm">
              Save $29.89 (50% off)
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-4">
              {annualFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              onClick={handleSelectPlan}
            >
              Select Annual
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};