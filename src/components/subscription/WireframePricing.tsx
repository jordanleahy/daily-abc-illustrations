import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { CheckCircle, Sparkles } from "lucide-react";

/**
 * Free Access Pricing Page Component
 */
export const WireframePricing = () => {
  const { user } = useAuthContext();
  const { hasRole } = useRole();
  const navigate = useNavigate();
  
  // Admins and teachers - show friendly message
  if (hasRole('admin') || hasRole('teacher')) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Card className="border-primary border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin/Teacher Access</CardTitle>
            <p className="text-muted-foreground mt-4">
              You have full access to all features as a privileged user!
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const features = [
    "Full library access",
    "Download PDF versions",
    "Habits & Rewards system",
    "Track reading progress",
    "Premium reading experience",
    "Daily published ABC books"
  ];

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Free For Everyone</h1>
        <p className="text-muted-foreground">
          All features are free with a simple signup
        </p>
      </div>

      <Card className="border-primary border-2">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Free Access</CardTitle>
          <div className="mt-4">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-muted-foreground">/forever</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          {user ? (
            <Button className="w-full" onClick={() => navigate('/')}>
              Go to Library
            </Button>
          ) : (
            <Button className="w-full" onClick={() => navigate('/auth?mode=signup')}>
              Sign Up Free
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
