import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Crown, Calendar, Check, RefreshCw } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { format } from "date-fns";

interface SubscriptionStatusProps {
  showActions?: boolean;
}

export const SubscriptionStatus = ({ showActions = true }: SubscriptionStatusProps) => {
  const { 
    isSubscribed, 
    subscription_end,
    cancel_at_period_end,
    loading, 
    checkSubscription, 
    createCheckoutSession,
    openCustomerPortal, 
    getSubscriptionTier,
    hasActiveSubscription,
    updateAutoRenewal,
    isRefreshing
  } = useSubscription();

  const [isUpdatingRenewal, setIsUpdatingRenewal] = useState(false);
  const currentTier = getSubscriptionTier();
  
  // Auto-renewal is enabled when cancel_at_period_end is false (or undefined for legacy subscriptions)
  const autoRenewEnabled = !cancel_at_period_end;

  const handleAutoRenewChange = async (checked: boolean | "indeterminate") => {
    setIsUpdatingRenewal(true);
    await updateAutoRenewal(checked === true);
    setIsUpdatingRenewal(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Checking subscription status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!isSubscribed) {
    const handleSelectPlan = async (priceId: string) => {
      await createCheckoutSession(priceId);
    };

    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-xl">Monthly Plan</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">$19.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Access to all daily published ABC books</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Download PDF version</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Full library access</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Premium reading experience</span>
                </li>
              </ul>
              {showActions && (
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectPlan(SUBSCRIPTION_TIERS.standard_monthly.price_id)}
                >
                  Select Monthly
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="border-2 border-primary relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-green-600">Save $139.89 (58% off)</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Annual Plan</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">$99.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Access to all daily published ABC books</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Download PDF version</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Full library access</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Premium reading experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span>Save over 58% vs monthly</span>
                </li>
              </ul>
              {showActions && (
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectPlan(SUBSCRIPTION_TIERS.standard_annual.price_id)}
                >
                  Select Annual
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {showActions && (
          <Button variant="outline" size="sm" onClick={checkSubscription} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {currentTier?.interval === 'month' ? 'Monthly Plan' : currentTier?.interval === 'year' ? 'Annual Plan' : 'Premium Plan'}
          </CardTitle>
          {currentTier && typeof currentTier.price === 'number' && (
            <p className="text-base font-semibold mt-1">
              ${(currentTier.price / 100).toFixed(2)}/{currentTier.interval === 'month' ? 'month' : 'year'}
            </p>
          )}
          <CardDescription>
            You have access to all premium features
          </CardDescription>
        </div>
        <Badge className="bg-green-600">
          Active
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            {subscription_end && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {autoRenewEnabled ? "Renews" : "Expires"} on{" "}
                  {format(new Date(subscription_end), "MMMM d, yyyy")}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-2 p-3 bg-background rounded-lg border">
              <Checkbox 
                id="auto-renew" 
                checked={autoRenewEnabled}
                onCheckedChange={handleAutoRenewChange}
                disabled={isUpdatingRenewal || isRefreshing}
              />
              <label
                htmlFor="auto-renew"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Renew automatically
              </label>
              {isUpdatingRenewal && (
                <RefreshCw className="h-4 w-4 animate-spin ml-auto" />
              )}
            </div>
            
            {!autoRenewEnabled && subscription_end && (
              <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-200 rounded p-2">
                Your subscription will not renew. You'll lose access to premium features after {format(new Date(subscription_end), "MMMM d, yyyy")}.
              </p>
            )}
            
            {!autoRenewEnabled && !subscription_end && (
              <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-200 rounded p-2">
                Your subscription will not renew at the end of the current period.
              </p>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Premium benefits:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Access to all daily published ABC books</li>
              <li>• Download PDF version</li>
              <li>• Full library access</li>
              <li>• Premium reading experience</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};