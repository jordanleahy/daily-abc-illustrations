import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Book, Sparkles } from "lucide-react";

/**
 * SubscriptionSuccess - Now shows welcome message for new signups
 * (Legacy route - redirects existing paid users appropriately)
 */
const SubscriptionSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to library after 5 seconds
    const timer = setTimeout(() => {
      navigate('/library');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                Welcome!
              </CardTitle>
              <CardDescription className="text-green-700">
                Your account is ready - enjoy free access to all features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-left">
                <h3 className="font-semibold mb-3">What's included:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Access to all daily published ABC books
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Download PDF versions of all books
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Habits & Rewards system
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Track reading progress
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Full library access
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={() => navigate('/library')} className="flex-1">
                  <Book className="h-4 w-4 mr-2" />
                  Go to Library
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>
                  You'll be redirected to the library automatically in a few seconds.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default SubscriptionSuccess;
