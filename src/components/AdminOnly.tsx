/**
 * Admin-only access control component
 * Thin wrapper around RoleGuard for admin-specific access
 */

import { ReactNode } from 'react';
import { RoleGuard } from './RoleGuard';
import { BaseComponentProps } from '@/types/shared/base';

interface AdminOnlyProps extends Pick<BaseComponentProps, 'className'> {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Restricts content to admin users only
 * Uses RoleGuard with allowHigherRoles=false to enforce strict admin access
 */
export const AdminOnly = ({ 
  children, 
  fallback, 
  showMessage = false,
  className
}: AdminOnlyProps) => {
  return (
    <RoleGuard
      requiredRole="admin"
      fallback={fallback}
      showMessage={showMessage}
      allowHigherRoles={false}
      className={className}
    >
      {children}
    </RoleGuard>
  );
};