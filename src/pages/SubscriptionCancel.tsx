import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, CreditCard } from "lucide-react";

const SubscriptionCancel = () => {
  return (
    <StandardPageLayout containerClassName="py-8">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-orange-600" />
            </div>
            <CardTitle className="text-2xl text-orange-800">
              Subscription Cancelled
            </CardTitle>
            <CardDescription className="text-orange-700">
              You cancelled the subscription process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-left">
              <h3 className="font-semibold mb-3">Don't worry!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You can always come back and subscribe later when you're ready. 
                Your account remains active with free access to our daily content.
              </p>
              
              <h4 className="font-medium mb-2">What you're missing with Premium:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Download PDF versions of all books</li>
                <li>• Access to complete book library</li>
                <li>• Ad-free browsing experience</li>
                <li>• Priority customer support</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1">
                <a href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href="/subscription">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Try Again
                </a>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>
                Questions about our pricing? Feel free to contact us for more information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default SubscriptionCancel;