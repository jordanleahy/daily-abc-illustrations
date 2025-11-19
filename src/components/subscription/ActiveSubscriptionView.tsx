import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { formatCoinsAsCurrency } from "@/utils/currency";

export const ActiveSubscriptionView = () => {
  const { getSubscriptionTier, openCustomerPortal, createCheckoutSession, loading, subscription_end } = useSubscription();
  const currentTier = getSubscriptionTier();
  
  if (!currentTier) return null;

  const subscriptionEnd = subscription_end 
    ? format(new Date(subscription_end), "MMMM d, yyyy")
    : null;

  const currentPlan = {
    name: currentTier.name,
    price: formatCoinsAsCurrency(currentTier.price),
    period: currentTier.interval,
    features: currentTier.interval === 'month' 
      ? [
          "Access to all daily published ABC books",
          "Download PDF version",
          "Full library access",
          "Premium reading experience"
        ]
      : [
          "Access to all daily published ABC books",
          "Download PDF version", 
          "Full library access",
          "Premium reading experience",
          "Early access to new books",
          "Educational activity guides"
        ]
  };

  const otherPlans = currentTier.interval === 'month' 
    ? [{
        name: "Annual Plan",
        price: "$29.99",
        period: "year",
        savings: "Save $149.89 (83% off)",
        priceId: SUBSCRIPTION_TIERS.plus_annual.price_id,
        buttonText: "Switch to Annual"
      }]
    : [{
        name: "Monthly Plan", 
        price: "$14.99",
        period: "month",
        priceId: SUBSCRIPTION_TIERS.plus_monthly.price_id,
        buttonText: "Switch to Monthly"
      }];

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Your Subscription</h1>
        <p className="text-muted-foreground">You're currently on the {currentPlan.name}</p>
      </div>

      {/* Current Plan - Hero Card */}
      <div className="max-w-2xl mx-auto mb-12">
        <Card className="border-primary border-2">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Badge className="text-sm px-4 py-1">Current Plan</Badge>
            </div>
            <CardTitle className="text-2xl">{currentPlan.name}</CardTitle>
            <div className="mt-4">
              <span className="text-4xl font-bold">{currentPlan.price}</span>
              <span className="text-muted-foreground">/{currentPlan.period}</span>
            </div>
            {subscriptionEnd && (
              <CardDescription className="mt-4">
                Renews on {subscriptionEnd}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={openCustomerPortal}
              disabled={loading}
            >
              Manage Subscription
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Update payment method, billing info, or cancel subscription
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Other Plans */}
      <div className="border-t pt-12">
        <h2 className="text-2xl font-semibold text-center mb-8">Other Plans</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {otherPlans.map((plan, index) => (
            <Card key={index}>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                {plan.savings && (
                  <div className="text-sm text-primary font-medium mt-2">
                    {plan.savings}
                  </div>
                )}
              </CardHeader>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={loading}
                  onClick={() => createCheckoutSession(plan.priceId)}
                >
                  {loading ? "Processing..." : plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

