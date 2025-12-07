import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { useAuthContext } from '@/contexts/AuthContext';
import { useAccessResolver } from '@/hooks/useAccessResolver';

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
  const { accessState, isReady } = useAccessResolver();
  const { createCheckoutSession } = useSubscription();
  const { user } = useAuthContext();

  // Only show loading if we have no cached state
  if (!isReady && accessState === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (accessState === 'locked') {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <CardTitle>Plus Feature</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to Plus to unlock {feature} with Habits & Rewards.
          </p>
          {showUpgrade && user && (
            <Button onClick={() => createCheckoutSession(SUBSCRIPTION_TIERS.plus_monthly.price_id)}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Plus
            </Button>
          )}
          {showUpgrade && !user && (
            <Button asChild>
              <a href="/auth?mode=signup">Sign Up Free</a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};
