import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { useAuthContext } from '@/contexts/AuthContext';

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
  const { hasActiveSubscription, loading, createCheckoutSession } = useSubscription();
  const { user } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <CardTitle>Premium Feature</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Unlock this {feature} with a premium subscription.
          </p>
          {showUpgrade && user && (
            <Button onClick={() => createCheckoutSession(SUBSCRIPTION_TIERS.standard_monthly.price_id)}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          )}
          {showUpgrade && !user && (
            <Button asChild>
              <a href="/auth?mode=signup">Get Started</a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
