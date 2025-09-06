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
          <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
            <div className="text-center space-y-8 max-w-2xl">
              {/* Hero Section */}
              <div className="space-y-4">
              </div>

              {/* Subscription Form */}
              <div className="bg-card border rounded-lg p-6 md:p-8 shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-card-foreground">
                  Subscribe for Daily Learning
                </h2>
                <p className="text-muted-foreground mb-6">
                  Enter your phone number to receive daily text messages with an image preview 
                  and link to download today's PDF.
                </p>
                
                <form className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="tel"
                      placeholder="Enter your phone number"
                      className="flex-1 px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                    <Button type="submit" size="lg" className="md:px-8">
                      Subscribe Now
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    📱 Free daily texts • 📚 High-quality PDFs • ❌ Cancel anytime
                  </p>
                </form>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 pt-8">
                <div className="text-center space-y-2">
                  <div className="text-3xl">📚</div>
                  <h3 className="font-semibold text-foreground">Daily PDFs</h3>
                  <p className="text-sm text-muted-foreground">
                    New A-Z learning content every single day
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl">📱</div>
                  <h3 className="font-semibold text-foreground">Text Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    Convenient delivery right to your phone
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl">🎨</div>
                  <h3 className="font-semibold text-foreground">Beautiful Art</h3>
                  <p className="text-sm text-muted-foreground">
                    High-quality illustrations kids will love
                  </p>
                </div>
              </div>

              {/* Sign In Link */}
              <div className="pt-8 border-t border-border">
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <Button variant="link" asChild className="p-0 h-auto">
                    <a href="/auth">Sign In</a>
                  </Button>
                </p>
              </div>
            </div>
          </div>
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
