import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Crown, Calendar, CreditCard, Settings, RefreshCw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
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

  const handleAutoRenewChange = async (checked: boolean) => {
    setIsUpdatingRenewal(true);
    await updateAutoRenewal(checked);
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
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Free Plan</CardTitle>
            <CardDescription>
              Upgrade to unlock all features
            </CardDescription>
          </div>
          <Badge variant="secondary">Free</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Current benefits:</p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• View daily published content</li>
                <li>• Limited access to features</li>
              </ul>
            </div>
            {showActions && (
              <div className="flex flex-col gap-2">
                <Button onClick={() => window.location.href = '/subscription'}>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
                <Button variant="outline" size="sm" onClick={checkSubscription}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
          {subscription_end && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {autoRenewEnabled ? "Renews" : "Expires"} on{" "}
                  {format(new Date(subscription_end), "MMMM d, yyyy")}
                </span>
              </div>
              
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
              
              {!autoRenewEnabled && (
                <p className="text-xs text-muted-foreground bg-orange-50 border border-orange-200 rounded p-2">
                  Your subscription will not renew. You'll lose access to premium features after {format(new Date(subscription_end), "MMMM d, yyyy")}.
                </p>
              )}
            </div>
          )}

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