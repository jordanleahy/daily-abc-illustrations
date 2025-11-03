/**
 * Teacher access control component
 * Thin wrapper around RoleGuard for teacher access
 * Automatically includes moderator and admin access via role hierarchy
 */

import { ReactNode } from 'react';
import { RoleGuard } from './RoleGuard';
import { BaseComponentProps } from '@/types/shared/base';

interface TeacherOnlyProps extends Pick<BaseComponentProps, 'className'> {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

/**
 * Restricts content to teacher users and higher (moderators, admins)
 * Uses RoleGuard with allowHigherRoles=true to include higher privilege access
 */
export const TeacherOnly = ({ 
  children, 
  fallback, 
  showMessage = false,
  className
}: TeacherOnlyProps) => {
  return (
    <RoleGuard
      requiredRole="teacher"
      fallback={fallback}
      showMessage={showMessage}
      allowHigherRoles={true}
      className={className}
    >
      {children}
    </RoleGuard>
  );
};