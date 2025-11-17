import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsAdmin, useIsTeacher } from '@/contexts/RoleContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { navigationConfig, RouteConfig } from '@/config/routes';
import { filterRoutesByPermission, isRouteActive } from '@/utils/navigation';

export const useNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const isTeacher = useIsTeacher();
  const { hasHabitsRewards } = useFeatureAccess();

  const userContext = useMemo(() => ({
    isAdmin,
    isTeacher,
    hasFeature: (feature: string) => {
      if (feature === 'habits_rewards') return hasHabitsRewards;
      return false;
    },
  }), [isAdmin, isTeacher, hasHabitsRewards]);

  // Filter routes based on permissions
  const availableRoutes = useMemo(() => {
    return filterRoutesByPermission(navigationConfig, userContext);
  }, [userContext]);

  // Check if a route is active
  const checkIsActive = (route: RouteConfig) => {
    return isRouteActive(route, location.pathname);
  };

  // Handle route navigation with custom logic
  const navigateToRoute = (route: RouteConfig, e?: React.MouseEvent<HTMLAnchorElement>) => {
    if (route.customClickHandler) {
      const handled = route.customClickHandler(navigate, location.pathname);
      if (handled && e) {
        e.preventDefault();
      } else if (!handled) {
        // Custom handler didn't handle it, use default navigation
        navigate(route.path);
        if (e) e.preventDefault();
      }
    } else {
      // No custom handler, use default navigation
      navigate(route.path);
      if (e) e.preventDefault();
    }
  };

  return {
    routes: availableRoutes,
    currentPath: location.pathname,
    isRouteActive: checkIsActive,
    navigateToRoute,
    isAdmin,
    isTeacher,
  };
};
