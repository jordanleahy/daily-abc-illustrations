import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Free Access Status - Shows user has full access
 */
interface SubscriptionStatusProps {
  showActions?: boolean;
}

export const SubscriptionStatus = ({ showActions = true }: SubscriptionStatusProps) => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const features = [
    "Access to all daily published ABC books",
    "Download PDF version",
    "Full library access",
    "Habits & Rewards system",
    "Premium reading experience"
  ];

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign Up for Free Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Create a free account to access all features.
          </p>
          {showActions && (
            <Button onClick={() => navigate('/auth?mode=signup')}>
              Sign Up Free
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Free Access
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            You have full access to all features
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
