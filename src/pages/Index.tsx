import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import DrawingCanvas from '@/components/DrawingCanvas';

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

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageLayout title="ABC Illustrations">
      <Container size="full" className="flex-1">
        <div className="h-full">
          <DrawingCanvas />
        </div>
      </Container>
    </PageLayout>
  );
};

export default Index;
