import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Free Access Active View - Shows user their access status
 */
export const ActiveSubscriptionView = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
        <p className="text-muted-foreground mb-6">Sign in to access all features.</p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  const features = [
    "Access to all daily published ABC books",
    "Download PDF version",
    "Full library access",
    "Habits & Rewards system",
    "Premium reading experience"
  ];

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">You Have Full Access</h1>
        <p className="text-muted-foreground">
          Enjoy all features for free!
        </p>
      </div>

      <Card className="border-primary border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Free Access</CardTitle>
          <div className="mt-2">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-muted-foreground">/forever</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <Button variant="outline" onClick={() => navigate('/')}>
          Go to Library
        </Button>
      </div>
    </div>
  );
};
