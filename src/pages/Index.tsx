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
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-foreground">Welcome to My App</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {isAuthenticated 
                ? "You're signed in and ready to explore!" 
                : "Get started by exploring our features or create an account for the full experience."
              }
            </p>
            <div className="flex gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Button asChild>
                    <a href="/auth">Sign Up</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/auth">Sign In</a>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <a href="/profile">View Profile</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
};

export default Index;
