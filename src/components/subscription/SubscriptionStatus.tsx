import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Crown, Calendar, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckoutOverlay } from "./CheckoutOverlay";

interface SubscriptionStatusProps {
  showActions?: boolean;
}

export const SubscriptionStatus = ({ showActions = true }: SubscriptionStatusProps) => {
  const { 
    hasActiveSubscription,
    subscription_end,
    cancel_at_period_end,
    loading, 
    checkSubscription, 
    createCheckoutSession,
    openCustomerPortal, 
    getSubscriptionTier,
    updateAutoRenewal,
    isRefreshing,
    isOpeningCheckout
  } = useSubscription();

  const [isUpdatingRenewal, setIsUpdatingRenewal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const currentTier = getSubscriptionTier();
  
  // Auto-renewal is enabled when cancel_at_period_end is false (or undefined for legacy subscriptions)
  const autoRenewEnabled = !cancel_at_period_end;

  const handleAutoRenewChange = async (checked: boolean | "indeterminate") => {
    // If user is trying to disable auto-renew (cancel subscription)
    if (!checked) {
      setShowCancelDialog(true);
      return;
    }
    
    // Re-enabling auto-renewal (no confirmation needed)
    setIsUpdatingRenewal(true);
    await updateAutoRenewal(true);
    setIsUpdatingRenewal(false);
  };

  const handleConfirmCancel = async () => {
    setShowCancelDialog(false);
    setIsUpdatingRenewal(true);
    await updateAutoRenewal(false);
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

  if (!hasActiveSubscription) {
    const handleSelectPlan = async (priceId: string) => {
      await createCheckoutSession(priceId);
    };

    return (
      <>
      <CheckoutOverlay isOpen={isOpeningCheckout} />
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Plan */}
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Monthly Plan</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">$14.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                <span>~30 books/month</span>
                <span>•</span>
                <span>$0.50/book</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Unlimited daily books</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>PDF downloads</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Progress tracking</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>Full library access</span>
                </li>
              </ul>
              {showActions && (
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectPlan(SUBSCRIPTION_TIERS.plus_monthly.price_id)}
                >
                  Select Monthly
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card className="border-2 border-primary relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
              Most Popular
            </Badge>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Annual Plan</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">$99.00</span>
                <span className="text-muted-foreground">/year</span>
                <Badge className="ml-2 bg-green-600">Save $80.88 (45% off)</Badge>
              </div>
              <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
                <span>~365 books/year</span>
                <span>•</span>
                <span>$0.27/book</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="font-medium">Everything in Monthly</span>
                </li>
              </ul>
              {showActions && (
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectPlan(SUBSCRIPTION_TIERS.plus_annual.price_id)}
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
      </>
    );
  }

  return (
    <>
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Cancel your subscription?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p className="text-base">
                You'll keep access until{" "}
                <span className="font-semibold">
                  {subscription_end ? format(new Date(subscription_end), "MMMM d, yyyy") : "the end of your billing period"}
                </span>.
              </p>
              
              <div>
                <p className="font-medium text-foreground mb-2">After that, you'll lose access to:</p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">•</span>
                    <span>Daily published ABC books</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">•</span>
                    <span>PDF downloads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-500">•</span>
                    <span>Full library access</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                You can re-subscribe anytime.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Renew automatically</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Uncheck to cancel subscription at period end
                  </span>
                </div>
              </label>
              {isUpdatingRenewal && (
                <RefreshCw className="h-4 w-4 animate-spin ml-auto" />
              )}
            </div>
            
            {!autoRenewEnabled && subscription_end && (
              <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-3">
                <p className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Subscription Cancelled
                </p>
                <p className="text-xs text-orange-800 mt-1">
                  You'll lose premium access after {format(new Date(subscription_end), "MMMM d, yyyy")}. 
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 ml-1 text-orange-800 underline"
                    onClick={() => handleAutoRenewChange(true)}
                    disabled={isUpdatingRenewal || isRefreshing}
                  >
                    Undo cancellation
                  </Button>
                </p>
              </div>
            )}
            
            {!autoRenewEnabled && !subscription_end && (
              <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-3">
                <p className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Subscription Cancelled
                </p>
                <p className="text-xs text-orange-800 mt-1">
                  Your subscription will not renew at the end of the current period.
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 ml-1 text-orange-800 underline"
                    onClick={() => handleAutoRenewChange(true)}
                    disabled={isUpdatingRenewal || isRefreshing}
                  >
                    Undo cancellation
                  </Button>
                </p>
              </div>
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
    </>
  );
};