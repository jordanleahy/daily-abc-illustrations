import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuthContext();

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Loading...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
