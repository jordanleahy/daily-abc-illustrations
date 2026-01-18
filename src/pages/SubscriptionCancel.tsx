import { useNavigate } from "react-router-dom";
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Sparkles } from "lucide-react";

/**
 * SubscriptionCancel - Legacy route that now redirects to signup
 */
const SubscriptionCancel = () => {
  const navigate = useNavigate();

  return (
    <StandardPageLayout containerClassName="py-8">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Sparkles className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Good News - It's Free!
            </CardTitle>
            <CardDescription>
              All features are now available for free
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              You don't need to pay anything. Just sign up for a free account to access all features.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={() => navigate('/')} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
              <Button onClick={() => navigate('/auth?mode=signup')} variant="outline" className="flex-1">
                Sign Up Free
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default SubscriptionCancel;
