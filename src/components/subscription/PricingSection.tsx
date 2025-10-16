import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Zap } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";

export const PricingSection = () => {
  const { createCheckoutSession, hasActiveSubscription, getSubscriptionTier, loading } = useSubscription();
  const currentTier = getSubscriptionTier();

  const freeFeatures = [
    "Browse full library",
    "Daily published ABC books",
    "View all content"
  ];

  const plusFeatures = [
    "Everything in Free, plus:",
    "Download PDF versions",
    "Habits & Rewards system",
    "Track reading progress",
    "Premium experience"
  ];

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-muted-foreground text-lg">
            Start free, upgrade for Habits & Rewards
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-4xl font-bold mt-4">
                $0
                <span className="text-lg font-normal text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                asChild
              >
                <a href="/auth?mode=signup">Sign Up Free</a>
              </Button>
            </CardFooter>
          </Card>
          {/* Plus Monthly Plan */}
          <Card className={`relative ${currentTier?.interval === 'month' ? 'ring-2 ring-primary' : ''}`}>
            {currentTier?.interval === 'month' && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Current Plan
              </Badge>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Zap className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Plus Monthly</CardTitle>
              <CardDescription>Full features for your family</CardDescription>
              <div className="text-4xl font-bold mt-4">
                $4.99
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plusFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => createCheckoutSession(SUBSCRIPTION_TIERS.plus_monthly.price_id)}
                disabled={loading || (hasActiveSubscription && currentTier?.interval === 'month')}
                variant={currentTier?.interval === 'month' ? "outline" : "default"}
              >
                {loading ? "Loading..." : 
                 currentTier?.interval === 'month' ? "Current Plan" : 
                 hasActiveSubscription ? "Switch to Monthly" : "Get Started"}
              </Button>
            </CardFooter>
          </Card>

          {/* Plus Annual Plan */}
          <Card className={`relative ${currentTier?.interval === 'year' ? 'ring-2 ring-primary' : ''}`}>
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
              Save 50%
            </Badge>
            {currentTier?.interval === 'year' && (
              <Badge className="absolute -top-3 right-4 bg-primary">
                Current Plan
              </Badge>
            )}
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Crown className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-2xl">Plus Annual</CardTitle>
              <CardDescription>Best value for committed families</CardDescription>
              <div className="text-4xl font-bold mt-4">
                $29.99
                <span className="text-lg font-normal text-muted-foreground">/year</span>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Save $29.89 compared to monthly
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plusFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Early access to new books</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => createCheckoutSession(SUBSCRIPTION_TIERS.plus_annual.price_id)}
                disabled={loading || (hasActiveSubscription && currentTier?.interval === 'year')}
                variant={currentTier?.interval === 'year' ? "outline" : "default"}
              >
                {loading ? "Loading..." : 
                 currentTier?.interval === 'year' ? "Current Plan" : 
                 hasActiveSubscription ? "Switch to Annual" : "Upgrade to Plus"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {hasActiveSubscription && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Need to update your billing information or cancel your subscription?
            </p>
            <Button variant="outline" onClick={() => window.open('/subscription/manage', '_blank')}>
              Manage Subscription
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};