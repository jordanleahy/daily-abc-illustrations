import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export const ProtectedRoute = ({ children, requireSubscription = true }: ProtectedRouteProps) => {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const location = useLocation();

  useEffect(() => {
    // Periodically validate session is still valid
    const validateSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Session invalid - clear and redirect
        await supabase.auth.signOut({ scope: 'local' });
        window.location.replace('/');
      }
    };

    if (isAuthenticated) {
      validateSession();
    }
  }, [isAuthenticated]);

  const loading = authLoading || subscriptionLoading;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check subscription requirement
  if (requireSubscription && !hasActiveSubscription) {
    // Redirect to pricing page with return URL
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/pricing?returnUrl=${returnUrl}`} replace />;
  }

  return <>{children}</>;
};
