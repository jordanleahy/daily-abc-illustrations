/**
 * Moderator access control component
 * Thin wrapper around RoleGuard for moderator access
 * Automatically includes admin access via role hierarchy
 */

import { ReactNode } from 'react';
import { RoleGuard } from './RoleGuard';
import { BaseComponentProps } from '@/types/shared/base';

interface ModeratorOnlyProps extends Pick<BaseComponentProps, 'className'> {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Restricts content to moderator users and higher (admins)
 * Uses RoleGuard with allowHigherRoles=true to include admin access
 */
export const ModeratorOnly = ({ 
  children, 
  fallback, 
  showMessage = false,
  className
}: ModeratorOnlyProps) => {
  return (
    <RoleGuard
      requiredRole="moderator"
      fallback={fallback}
      showMessage={showMessage}
      allowHigherRoles={true}
      className={className}
    >
      {children}
    </RoleGuard>
  );
};