import { ReactNode } from 'react';
import { useHasRole } from '@/hooks/useUserRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const AdminOnly = ({ 
  children, 
  fallback, 
  showMessage = false 
}: AdminOnlyProps) => {
  const isAdmin = useHasRole('admin');
  
  if (isAdmin) {
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
          Access denied. Admin privileges required.
        </AlertDescription>
      </Alert>
    );
  }
  
  return null;
};