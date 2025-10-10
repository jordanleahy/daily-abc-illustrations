import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Book } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    // Give Stripe 2 seconds to activate subscription, then check status
    const timer = setTimeout(async () => {
      await checkSubscription();
    }, 2000);

    // Show success toast immediately
    toast({
      title: "Payment Successful!",
      description: "Your subscription is now active. Welcome to Premium!",
    });

    return () => clearTimeout(timer);
  }, [checkSubscription, toast]);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                Welcome to Premium!
              </CardTitle>
              <CardDescription className="text-green-700">
                Your subscription has been activated successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-left">
                <h3 className="font-semibold mb-3">What's included in your plan:</h3>
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
                    Ad-free browsing experience
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Premium customer support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Early access to new features
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={() => navigate('/')} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
                <Button onClick={() => navigate('/library')} variant="outline" className="flex-1">
                  <Book className="h-4 w-4 mr-2" />
                  Browse Library
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>
                  You can manage your subscription anytime from your profile page.
                  A confirmation email has been sent to your registered email address.
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