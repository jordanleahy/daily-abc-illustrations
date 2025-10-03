import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    loading, 
    checkSubscription, 
    openCustomerPortal, 
    getSubscriptionTier,
    hasActiveSubscription 
  } = useSubscription();

  const currentTier = getSubscriptionTier();

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
            {currentTier?.name || "Premium Plan"}
          </CardTitle>
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
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {hasActiveSubscription ? "Renews" : "Expired"} on{" "}
                {format(new Date(subscription_end), "MMMM d, yyyy")}
              </span>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Premium benefits:</p>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Access to all daily published ABC books</li>
              <li>• Download PDF versions</li>
              <li>• Ad-free experience</li>
              <li>• Premium support</li>
              <li>• Early access to new features</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};