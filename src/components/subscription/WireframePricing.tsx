import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const WireframePricing = () => {
  const { createCheckoutSession, isSubscribed, getSubscriptionTier, loading, openCustomerPortal, hasActiveSubscription } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentTier = getSubscriptionTier();
  
  // For free authenticated users, all plans should be available
  const isCurrentlyFree = Boolean(user && !hasActiveSubscription);

  const handlePlanSelection = (priceId: string) => {
    if (!user) {
      navigate(`/auth?mode=signup&returnUrl=/subscription&plan=${priceId}`);
      return;
    }
    createCheckoutSession(priceId);
  };

  const plans = [
    {
      name: "Free Plan",
      price: "$0",
      period: "forever",
      features: [
        "View today's ABC book",
        "Limited daily access", 
        "Basic reading experience"
      ],
      buttonText: isCurrentlyFree ? "Current Plan" : "Sign Up Free",
      buttonDisabled: isCurrentlyFree,
      current: !isSubscribed
    },
    {
      name: "Monthly Plan", 
      price: "$9.99",
      period: "month",
      features: [
        "Access to all daily published ABC books",
        "Download PDF version",
        "Full library access",
        "Premium reading experience"
      ],
      buttonText: currentTier?.interval === 'month' ? "Current Plan" : "Select",
      buttonDisabled: loading || (isSubscribed && currentTier?.interval === 'month'),
      current: currentTier?.interval === 'month',
      onClick: () => handlePlanSelection(SUBSCRIPTION_TIERS.standard_monthly.price_id)
    },
    {
      name: "Annual Plan",
      price: "$29.99", 
      originalPrice: "$29.99",
      discountedPrice: "$23.99", // 20% off = $6 discount  
      period: "year",
      savings: "Save $89.89 + 20% OFF",
      features: [
        "Access to all daily published ABC books",
        "Download PDF version", 
        "Full library access",
        "Premium reading experience",
        "Early access to new books",
        "Educational activity guides"
      ],
      buttonText: currentTier?.interval === 'year' ? "Current Plan" : "Select",
      buttonDisabled: loading || (isSubscribed && currentTier?.interval === 'year'),
      current: currentTier?.interval === 'year',
      onClick: () => handlePlanSelection(SUBSCRIPTION_TIERS.standard_annual.price_id),
      hasDiscount: true
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
                {plan.hasDiscount ? (
                  <div>
                    <div className="text-lg text-muted-foreground line-through">{plan.originalPrice}</div>
                    <span className="text-3xl font-bold text-green-600">{plan.discountedPrice}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                    <div className="text-sm text-green-600 font-medium mt-1">20% OFF Applied Automatically!</div>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                )}
              </div>
              {plan.savings && !plan.hasDiscount && (
                <div className="text-sm text-green-600 font-medium">
                  {plan.savings}
                </div>
              )}
              {plan.savings && plan.hasDiscount && (
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