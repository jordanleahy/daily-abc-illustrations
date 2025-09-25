import { PageLayout } from "@/components/layout/PageLayout";
import { DuolingoStylePricing } from "@/components/subscription/DuolingoStylePricing";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const Subscription = () => {
  const { user } = useAuth();

  return (
    <PageLayout showHeader={false}>
      <DuolingoStylePricing />
      
      {!user && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="bg-duolingo-blue/95 border-duolingo-blue text-white backdrop-blur-sm shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  👋
                </div>
                <div>
                  <div className="font-semibold text-sm">New here?</div>
                  <div className="text-xs opacity-90">Sign in to track your progress!</div>
                </div>
                <a 
                  href="/auth" 
                  className="bg-white text-duolingo-blue px-4 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-colors ml-2"
                >
                  Sign In
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
};

export default Subscription;