import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ActiveSubscriptionView } from "./ActiveSubscriptionView";
import { useRole } from "@/contexts/RoleContext";

export const WireframePricing = () => {
  const { createCheckoutSession, hasActiveSubscription, getSubscriptionTier, loading, openCustomerPortal } = useSubscription();
  const { user } = useAuthContext();
  const { hasRole } = useRole();
  const navigate = useNavigate();
  const currentTier = getSubscriptionTier();
  
  // Admins and teachers don't need subscriptions - redirect them
  if (hasRole('admin') || hasRole('teacher')) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card className="border-primary border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin/Teacher Access</CardTitle>
            <p className="text-muted-foreground mt-4">
              You have full access to all features as a privileged user. No subscription needed!
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
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
      name: "Plus Monthly",
      price: "$14.99",
      period: "month",
      features: [
        "Full library access",
        "Download PDF versions",
        "Habits & Rewards system",
        "Track reading progress",
        "Premium reading experience"
      ],
      buttonText: currentTier?.interval === 'month' ? "Current Plan" : "Select Monthly",
      buttonDisabled: loading || (hasActiveSubscription && currentTier?.interval === 'month'),
      current: currentTier?.interval === 'month',
      onClick: () => handlePlanSelection(SUBSCRIPTION_TIERS?.plus_monthly?.price_id || '')
    },
    {
      name: "Plus Annual",
      price: "$99.00", 
      period: "year",
      savings: "Save $80.88 (45% off)",
      features: [
        "Everything in Plus Monthly, plus:",
        "Early access to new books",
        "Educational activity guides",
        "Priority support",
        "Best value - save 83%"
      ],
      buttonText: currentTier?.interval === 'year' ? "Current Plan" : "Select Annual",
      buttonDisabled: loading || (hasActiveSubscription && currentTier?.interval === 'year'),
      current: currentTier?.interval === 'year',
      onClick: () => handlePlanSelection(SUBSCRIPTION_TIERS?.plus_annual?.price_id || '')
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Simple header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
      </div>

      {/* 2-column layout */}
      <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
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