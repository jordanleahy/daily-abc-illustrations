import { useNavigate } from "react-router-dom";
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

/**
 * SubscriptionManage - Now shows free access status
 */
const SubscriptionManage = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  if (!user) {
    return (
      <StandardPageLayout containerClassName="py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to view your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </StandardPageLayout>
    );
  }

  const features = [
    "Access to all daily published ABC books",
    "Download PDF versions",
    "Full library access",
    "Habits & Rewards system",
    "Track reading progress"
  ];

  return (
    <StandardPageLayout containerClassName="py-8">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="mx-auto mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Your Free Account</CardTitle>
            <CardDescription>
              You have full access to all features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-2 text-left">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default SubscriptionManage;
