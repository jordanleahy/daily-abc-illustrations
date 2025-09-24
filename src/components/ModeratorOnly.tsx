import { ReactNode } from 'react';
import { useIsAdmin, useIsModerator } from '@/contexts/RoleContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface ModeratorOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const ModeratorOnly = ({ 
  children, 
  fallback, 
  showMessage = false 
}: ModeratorOnlyProps) => {
  const isModerator = useIsModerator();
  const isAdmin = useIsAdmin(); // Admins can access moderator features
  
  if (isModerator || isAdmin) {
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
          Access denied. Moderator privileges required.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};