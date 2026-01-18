import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';

/**
 * SubscriptionCheckout - Now redirects to signup since app is free
 */
const SubscriptionCheckout = () => {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    // If authenticated, redirect to home
    if (isAuthenticated) {
      navigate('/');
      return;
    }
  }, [authLoading, isAuthenticated, navigate]);

  return (
    <PageLayout>
      <Container size="sm" className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Free Access
            </CardTitle>
            <CardDescription>
              All features are now free! Sign up to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/auth?mode=signup')}>
              Sign Up Free
            </Button>
          </CardContent>
        </Card>
      </Container>
    </PageLayout>
  );
};

export default SubscriptionCheckout;
