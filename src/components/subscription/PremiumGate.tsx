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

  // Premium gate temporarily disabled - always show content
  return <>{children}</>;
};