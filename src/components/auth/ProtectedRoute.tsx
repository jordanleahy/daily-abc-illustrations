import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useRole } from '@/contexts/RoleContext';
import { LoadingState } from '@/components/ui/loading-state';

type AppRole = 'user' | 'teacher' | 'moderator' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  requireRole?: AppRole;
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireSubscription = true,
  requireRole,
  redirectTo
}: ProtectedRouteProps) => {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const { hasRole, isLoading: roleLoading } = useRole();
  const location = useLocation();

  const loading = authLoading || (requireSubscription ? subscriptionLoading : false) || (requireRole ? roleLoading : false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingState text="Verifying access..." />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo || '/auth'} replace />;
  }

  // Check role requirement
  if (requireRole && !hasRole(requireRole)) {
    return <Navigate to={redirectTo || '/'} replace />;
  }

  // Check subscription requirement
  if (requireSubscription && !hasActiveSubscription) {
    // Prevent redirect loop
    if (location.pathname === '/pricing') {
      return <>{children}</>;
    }
    return <Navigate to={redirectTo || '/pricing'} replace />;
  }

  return <>{children}</>;
};
