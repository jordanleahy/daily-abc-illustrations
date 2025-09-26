import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";

export const WireframePricing = () => {
  const { createCheckoutSession, isSubscribed, getSubscriptionTier, loading, openCustomerPortal } = useSubscription();
  const currentTier = getSubscriptionTier();

  const plans = [
    {
      name: "Free Plan",
      price: "$0",
      period: "forever",
      features: [
        "Basic feature A",
        "Basic feature B", 
        "Basic feature C"
      ],
      buttonText: "Current Plan",
      buttonDisabled: true,
      current: !isSubscribed
    },
    {
      name: "Monthly Plan", 
      price: "$9.99",
      period: "month",
      features: [
        "All basic features",
        "Premium feature A",
        "Premium feature B",
        "Premium feature C",
        "Premium feature D"
      ],
      buttonText: currentTier?.interval === 'month' ? "Current Plan" : "Choose Monthly",
      buttonDisabled: loading || (isSubscribed && currentTier?.interval === 'month'),
      current: currentTier?.interval === 'month',
      onClick: () => createCheckoutSession(SUBSCRIPTION_TIERS.standard_monthly.price_id)
    },
    {
      name: "Annual Plan",
      price: "$29.99", 
      period: "year",
      savings: "Save $89.89",
      features: [
        "All basic features",
        "Premium feature A", 
        "Premium feature B",
        "Premium feature C",
        "Premium feature D",
        "Bonus feature E"
      ],
      buttonText: currentTier?.interval === 'year' ? "Current Plan" : "Choose Annual",
      buttonDisabled: loading || (isSubscribed && currentTier?.interval === 'year'),
      current: currentTier?.interval === 'year',
      onClick: () => createCheckoutSession(SUBSCRIPTION_TIERS.standard_annual.price_id)
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Simple header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground">Select the plan that works best for you</p>
      </div>

      {/* Simple 3-column layout */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan, index) => (
          <Card key={index} className={`${plan.current ? 'border-primary' : 'border-border'}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              {plan.savings && (
                <div className="text-sm text-green-600 font-medium">
                  {plan.savings}
                </div>
              )}
              {plan.current && (
                <div className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded">
                  Current Plan
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.current ? "outline" : "default"}
                disabled={plan.buttonDisabled}
                onClick={plan.onClick}
              >
                {loading ? "Loading..." : plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Subscription management for authenticated users */}
      {isSubscribed && (
        <div className="text-center p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Manage Your Subscription</h3>
          <p className="text-muted-foreground mb-4">
            Need to update billing or make changes?
          </p>
          <Button variant="outline" onClick={openCustomerPortal}>
            Manage Subscription
          </Button>
        </div>
      )}
    </div>
  );
};