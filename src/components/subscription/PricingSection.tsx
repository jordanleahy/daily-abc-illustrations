import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Free Access Pricing Section
 * Shows that all features are available for free with signup
 */
export const PricingSection = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const features = [
    "Full library access",
    "Download PDF versions",
    "Habits & Rewards system",
    "Track reading progress",
    "Premium reading experience",
    "Daily published ABC books"
  ];

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Free For Everyone</h2>
          <p className="text-muted-foreground text-lg">
            Sign up for free and get access to all features
          </p>
        </div>

        <Card className="border-primary border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Free Access</CardTitle>
            <div className="text-4xl font-bold mt-4">
              $0
              <span className="text-lg font-normal text-muted-foreground">/forever</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
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
    </div>
  );
};
