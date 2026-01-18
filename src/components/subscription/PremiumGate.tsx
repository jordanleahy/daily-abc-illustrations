import { ReactNode } from "react";
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface PremiumGateProps {
  children: ReactNode;
  feature?: string;
  description?: string;
  showUpgrade?: boolean;
}

/**
 * PremiumGate - Now just checks for authentication
 * All authenticated users have full access
 */
export const PremiumGate = ({ 
  children, 
  feature = "feature", 
  description = "Sign in to access this feature.",
  showUpgrade = true 
}: PremiumGateProps) => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not authenticated - show sign in prompt
  if (!user) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <CardTitle>Sign In Required</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Create a free account to access {feature}.
          </p>
          {showUpgrade && (
            <Button onClick={() => navigate('/auth?mode=signup')}>
              Sign Up Free
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Authenticated - show content
  return <>{children}</>;
};
