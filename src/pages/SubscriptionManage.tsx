import { useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

const SubscriptionManage = () => {
  const { isSubscribed, openCustomerPortal, loading } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    // Auto-redirect to customer portal if user has active subscription
    if (isSubscribed && !loading) {
      const timer = setTimeout(() => {
        openCustomerPortal();
      }, 3000); // Give user a moment to read the message

      return () => clearTimeout(timer);
    }
  }, [isSubscribed, loading, openCustomerPortal]);

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
                <span>Loading subscription details...</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!isSubscribed) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>
                  You don't currently have an active subscription to manage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To access subscription management features, you need to have an active subscription first.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild>
                    <a href="/subscription">
                      View Pricing Plans
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Home
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle>Manage Your Subscription</CardTitle>
              <CardDescription>
                Redirecting you to the Stripe Customer Portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-left">
                <p className="text-sm text-muted-foreground mb-4">
                  You'll be redirected to Stripe's secure customer portal where you can:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>• Update your payment method</li>
                  <li>• Change your billing address</li>
                  <li>• View your billing history</li>
                  <li>• Download invoices</li>
                  <li>• Cancel or modify your subscription</li>
                  <li>• Update your subscription plan</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={openCustomerPortal} disabled={loading}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {loading ? "Opening..." : "Open Customer Portal"}
                </Button>
                <Button asChild variant="outline">
                  <a href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </a>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>
                  The customer portal is securely hosted by Stripe. 
                  Any changes you make will be reflected in your account immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default SubscriptionManage;