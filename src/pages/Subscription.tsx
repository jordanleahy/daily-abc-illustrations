import { PageLayout } from "@/components/layout/PageLayout";
import { PricingSection } from "@/components/subscription/PricingSection";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const Subscription = () => {
  const { user } = useAuth();

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Subscription Management</h1>
            <p className="text-muted-foreground text-lg">
              Manage your Daily ABC Illustrations subscription
            </p>
          </div>

          {user && (
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Current Status</CardTitle>
                  <CardDescription>
                    Your current subscription status and benefits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionStatus />
                </CardContent>
              </Card>
            </div>
          )}

          <PricingSection />

          {!user && (
            <div className="mt-8">
              <Card className="bg-blue-50/50 border-blue-200">
                <CardHeader className="text-center">
                  <CardTitle>Sign In Required</CardTitle>
                  <CardDescription>
                    Please sign in to view your subscription status and manage your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <a 
                    href="/auth" 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Sign In
                  </a>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Subscription;