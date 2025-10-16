import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useRole } from '@/contexts/RoleContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { LoadingState } from '@/components/ui/loading-state';

type AppRole = 'user' | 'teacher' | 'moderator' | 'admin';
type Feature = 'habits_rewards' | 'library';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  requireRole?: AppRole;
  requireFeature?: Feature;
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireSubscription = true,
  requireRole,
  requireFeature,
  redirectTo
}: ProtectedRouteProps) => {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const { hasRole, isLoading: roleLoading } = useRole();
  const { hasHabitsRewards, hasLibraryAccess, loading: featureLoading } = useFeatureAccess();
  const location = useLocation();

  const loading = authLoading || 
    (requireSubscription ? subscriptionLoading : false) || 
    (requireRole ? roleLoading : false) ||
    (requireFeature ? featureLoading : false);

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

  // Check feature requirement (more granular than subscription)
  if (requireFeature) {
    if (requireFeature === 'habits_rewards' && !hasHabitsRewards) {
      return <Navigate to={redirectTo || '/pricing'} state={{ upgrade: 'habits_rewards' }} replace />;
    }
    if (requireFeature === 'library' && !hasLibraryAccess) {
      return <Navigate to={redirectTo || '/pricing'} state={{ upgrade: 'library' }} replace />;
    }
  }

  // Check subscription requirement (legacy support)
  if (requireSubscription && !hasActiveSubscription) {
    // Prevent redirect loop
    if (location.pathname === '/pricing') {
      return <>{children}</>;
    }
    return <Navigate to={redirectTo || '/pricing'} replace />;
  }

  return <>{children}</>;
};
