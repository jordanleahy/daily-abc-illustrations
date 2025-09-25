import { ReactNode } from 'react';
import { useIsAdmin, useIsModerator, useIsTeacher } from '@/contexts/RoleContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface TeacherOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const TeacherOnly = ({ 
  children, 
  fallback, 
  showMessage = false 
}: TeacherOnlyProps) => {
  const isTeacher = useIsTeacher();
  const isModerator = useIsModerator();
  const isAdmin = useIsAdmin(); // Admins and moderators can access teacher features
  
  if (isTeacher || isModerator || isAdmin) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showMessage) {
    return (
      <Alert variant="destructive">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          Access denied. Teacher privileges required.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};