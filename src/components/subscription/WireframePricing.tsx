import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ActiveSubscriptionView } from "./ActiveSubscriptionView";

export const WireframePricing = () => {
  const { createCheckoutSession, hasActiveSubscription, getSubscriptionTier, loading, openCustomerPortal } = useSubscription();
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentTier = getSubscriptionTier();
  
  // If user has active subscription, show active subscription view
  if (hasActiveSubscription && currentTier) {
    return <ActiveSubscriptionView />;
  }
  
  // For free authenticated users, all plans should be available
  const isCurrentlyFree = Boolean(user && !hasActiveSubscription);

  const handlePlanSelection = (priceId: string) => {
    if (!user) {
      navigate('/auth?mode=signup');
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
      current: !hasActiveSubscription,
      onClick: () => navigate('/auth?mode=signup')
    },
    {
      name: "Monthly Plan", 
      price: "$4.99",
      period: "month",
      features: [
        "Access to all daily published ABC books",
        "Download PDF version",
        "Full library access",
        "Premium reading experience"
      ],
      buttonText: currentTier?.interval === 'month' ? "Current Plan" : "Select Monthly",
      buttonDisabled: loading || (hasActiveSubscription && currentTier?.interval === 'month'),
      current: currentTier?.interval === 'month',
      onClick: () => handlePlanSelection(SUBSCRIPTION_TIERS?.standard_monthly?.price_id || '')
    },
    {
      name: "Annual Plan",
      price: "$29.99", 
      period: "year",
      savings: "Save $29.89 (50% off)",
      features: [
        "Access to all daily published ABC books",
        "Download PDF version", 
        "Full library access",
        "Premium reading experience",
        "Early access to new books",
        "Educational activity guides"
      ],
      buttonText: currentTier?.interval === 'year' ? "Current Plan" : "Select Annual",
      buttonDisabled: loading || (hasActiveSubscription && currentTier?.interval === 'year'),
      current: currentTier?.interval === 'year',
      onClick: () => handlePlanSelection(SUBSCRIPTION_TIERS?.standard_annual?.price_id || '')
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
          <Card key={index} className={`${plan.current ? 'border-primary border-2' : ''}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              {plan.savings && (
                <div className="text-sm text-success font-medium">
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
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.current ? "outline" : "default"}
                disabled={plan.buttonDisabled || loading}
                onClick={plan.onClick}
              >
                {loading ? "Processing..." : plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Subscription management for authenticated users */}
      {hasActiveSubscription && (
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