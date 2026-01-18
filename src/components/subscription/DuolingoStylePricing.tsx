import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * Simplified Pricing Component - Free Access Only
 */
export const DuolingoStylePricing = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const features = [
    "Daily learning adventures",
    "Full library access",
    "Download PDF versions",
    "Habits & Rewards system",
    "Track reading progress",
    "Premium reading experience"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-4xl">
              📚
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Free For Everyone
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            All features included with a simple signup
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-16">
        <Card className="border-primary border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Free Access</CardTitle>
            <div className="text-4xl font-bold mt-4">
              $0<span className="text-lg font-normal text-muted-foreground">/forever</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 mb-6">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            {user ? (
              <Button className="w-full" size="lg" onClick={() => navigate('/')}>
                Go to Library
              </Button>
            ) : (
              <Button className="w-full" size="lg" onClick={() => navigate('/auth?mode=signup')}>
                Sign Up Free
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
