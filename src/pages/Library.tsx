import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHasRole } from '@/hooks/useUserRole';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';

const Library = () => {
  const { user, loading: authLoading } = useAuth();
  const hasUserRole = useHasRole('user');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <PageLayout title="My Library">
        <Container>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  if (!hasUserRole) {
    return (
      <PageLayout title="Access Denied">
        <Container>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Library">
      <Container>
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-6">My Library</h1>
          <p className="text-muted-foreground">Your personal library content will appear here.</p>
        </div>
      </Container>
    </PageLayout>
  );
};

export default Library;