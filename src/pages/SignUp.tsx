import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useClerkAuth';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignUp() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSuccess = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <PageLayout>
      <Container>
        <div className="min-h-[60vh] flex items-center justify-center py-12">
          <div className="w-full max-w-md space-y-6">
            <div className="flex items-center justify-between">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>

            <Card>
              <CardContent className="p-6">
                <SignUpForm onSuccess={handleSuccess} />
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}