import { useAuth } from '@/hooks/useAuth';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Container>
        {!isAuthenticated ? (
          <div></div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold text-foreground">Welcome Back!</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                You're signed in and ready to explore ABC Illustrations!
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <a href="/profile">View Profile</a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </PageLayout>
  );
};

export default Index;
