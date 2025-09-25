import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

interface PremiumGateProps {
  children: ReactNode;
  feature?: string;
  description?: string;
  showUpgrade?: boolean;
}

export const PremiumGate = ({ 
  children, 
  feature = "premium feature", 
  description = "This feature requires a premium subscription.",
  showUpgrade = true 
}: PremiumGateProps) => {
  const { isSubscribed, hasActiveSubscription, loading } = useSubscription();
  const { user } = useAuth();

  // Show content if user has active subscription
  if (hasActiveSubscription) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
          <span>Checking subscription status...</span>
        </CardContent>
      </Card>
    );
  }

  // Show premium gate
  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <Lock className="h-12 w-12 text-orange-600" />
        </div>
        <CardTitle className="text-xl text-orange-800 capitalize">
          Premium {feature}
        </CardTitle>
        <CardDescription className="text-orange-700">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Unlock this feature with a premium subscription:</p>
          <ul className="text-left space-y-1 max-w-xs mx-auto">
            <li>• Access to all daily published books</li>
            <li>• Download PDF versions</li>
            <li>• Ad-free experience</li>
            <li>• Premium support</li>
          </ul>
        </div>

        {showUpgrade && (
          <div className="flex flex-col gap-2 pt-2">
            {user ? (
              <Button asChild>
                <a href="/subscription">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </a>
              </Button>
            ) : (
              <Button asChild>
                <a href="/auth">
                  <Zap className="h-4 w-4 mr-2" />
                  Sign In to Subscribe
                </a>
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Start at just $9.99/month • Cancel anytime
        </div>
      </CardContent>
    </Card>
  );
};