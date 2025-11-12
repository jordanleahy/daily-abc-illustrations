import { RouteConfig, RoutePermission } from '@/config/routes';

/**
 * Check if user has permission to access a route
 */
export const hasRoutePermission = (
  permission: RoutePermission | undefined,
  userContext: {
    isAdmin: boolean;
    isTeacher: boolean;
    hasFeature: (feature: string) => boolean;
  }
): boolean => {
  if (!permission) return true;

  if (permission.role === 'admin' && !userContext.isAdmin) return false;
  if (permission.role === 'teacher' && !userContext.isTeacher) return false;
  if (permission.feature && !userContext.hasFeature(permission.feature)) return false;

  return true;
};

/**
 * Check if a route is active based on current pathname
 */
export const isRouteActive = (
  route: RouteConfig,
  currentPath: string
): boolean => {
  const { path, activeMatch } = route;

  // No custom rules, use exact match
  if (!activeMatch) {
    return currentPath === path;
  }

  // Exact match rule
  if (activeMatch.exact) {
    return currentPath === path;
  }

  // Starts with match
  if (activeMatch.startsWith) {
    const matches = currentPath.startsWith(path);
    
    // Check exclusions
    if (matches && activeMatch.exclude) {
      return !activeMatch.exclude.some(excluded => currentPath.startsWith(excluded));
    }
    
    return matches;
  }

  // Pattern match
  if (activeMatch.pattern) {
    return activeMatch.pattern.test(currentPath);
  }

  // Default to exact match
  return currentPath === path;
};

/**
 * Filter routes based on user permissions
 */
export const filterRoutesByPermission = (
  routes: RouteConfig[],
  userContext: {
    isAdmin: boolean;
    isTeacher: boolean;
    hasFeature: (feature: string) => boolean;
  }
): RouteConfig[] => {
  return routes.filter(route => hasRoutePermission(route.permission, userContext));
};

/**
 * Get navigation items for a specific group
 */
export const getRoutesByGroup = (
  routes: RouteConfig[],
  group: string
): RouteConfig[] => {
  return routes.filter(route => route.group === group);
};
