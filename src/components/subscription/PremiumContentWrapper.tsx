import { ReactNode } from "react";
import { Lock, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface PremiumContentWrapperProps {
  children: ReactNode;
  showOverlay?: boolean;
  className?: string;
}

export const PremiumContentWrapper = ({ 
  children, 
  showOverlay = true,
  className = ""
}: PremiumContentWrapperProps) => {
  const { hasActiveSubscription, loading, createCheckoutSession } = useSubscription();
  const { isAuthenticated } = useAuthContext();

  // If loading or user has subscription, show content normally
  if (loading || hasActiveSubscription) {
    return <>{children}</>;
  }

  // If not authenticated, show content normally (they'll hit auth wall elsewhere)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // User is authenticated but doesn't have subscription
  if (showOverlay) {
    return (
      <div className={`relative ${className}`}>
        {/* Content (blurred/dimmed) */}
        <div className="pointer-events-none opacity-60 blur-[2px]">
          {children}
        </div>
        
        {/* Premium overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-4 p-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-3">
                <Lock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Premium Content</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to access the full library
              </p>
            </div>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                createCheckoutSession("price_1RBzKVP6s2BxJmNFaGe2wKwc");
              }}
              size="sm"
              className="shadow-lg"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No overlay mode - just return children but they won't be clickable due to parent logic
  return <>{children}</>;
};
