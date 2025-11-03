/**
 * Generic role-based access control component
 * Provides unified logic for protecting content based on user roles
 */

import { ReactNode } from 'react';
import { useIsAdmin, useIsModerator, useIsTeacher, useRole } from '@/contexts/RoleContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';
import { BaseComponentProps } from '@/types/shared/base';

export type UserRole = 'admin' | 'moderator' | 'teacher';

interface RoleGuardProps extends BaseComponentProps {
  /** Required role(s) to view content */
  requiredRole: UserRole | UserRole[];
  /** Content to show if user has required role */
  children: ReactNode;
  /** Optional fallback content to show if user lacks role */
  fallback?: ReactNode;
  /** Whether to show access denied message */
  showMessage?: boolean;
  /** Whether to allow higher roles (e.g., admin accessing moderator content) */
  allowHigherRoles?: boolean;
}

/**
 * Role hierarchy mapping for privilege escalation
 * admin > moderator > teacher
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  moderator: 2,
  teacher: 1,
};

/**
 * Generic role guard component for access control
 * Supports single or multiple required roles with hierarchical access
 */
export const RoleGuard = ({
  requiredRole,
  children,
  fallback,
  showMessage = false,
  allowHigherRoles = true,
  className,
}: RoleGuardProps) => {
  const isAdmin = useIsAdmin();
  const isModerator = useIsModerator();
  const isTeacher = useIsTeacher();
  const { isLoading } = useRole();

  // Map hooks to role checks
  const roleChecks: Record<UserRole, boolean> = {
    admin: isAdmin,
    moderator: isModerator,
    teacher: isTeacher,
  };

  // Get current user's highest role level
  const currentRoleLevel = Math.max(
    isAdmin ? ROLE_HIERARCHY.admin : 0,
    isModerator ? ROLE_HIERARCHY.moderator : 0,
    isTeacher ? ROLE_HIERARCHY.teacher : 0,
    0
  );

  // Normalize required roles to array
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  // Check if user has any of the required roles
  const hasRequiredRole = requiredRoles.some((role) => {
    if (roleChecks[role]) return true;
    
    // Check if higher roles are allowed
    if (allowHigherRoles) {
      const requiredLevel = ROLE_HIERARCHY[role];
      return currentRoleLevel >= requiredLevel;
    }
    
    return false;
  });

  // Show children while loading to prevent flash
  if (isLoading || hasRequiredRole) {
    return <div className={className}>{children}</div>;
  }

  // Show fallback if provided
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Show access denied message if requested
  if (showMessage) {
    const roleText = requiredRoles.length > 1 
      ? `${requiredRoles.slice(0, -1).join(', ')} or ${requiredRoles[requiredRoles.length - 1]}`
      : requiredRoles[0];

    return (
      <Alert variant="destructive" className={className}>
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          Access denied. {roleText.charAt(0).toUpperCase() + roleText.slice(1)} privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
