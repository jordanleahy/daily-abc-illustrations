import { useAuth } from '@/hooks/useAuth';
import { useHasRole } from '@/hooks/useUserRole';
import { UserHeader } from './UserHeader';
import { AdminHeader } from './AdminHeader';
import { PageHeader } from './PageHeader';

interface SmartHeaderProps {
  title?: string;
  subtitle?: string;
  bookId?: string;
  showQRCode?: boolean;
  onBack?: () => void;
}

export function SmartHeader(props: SmartHeaderProps) {
  const { isAuthenticated } = useAuth();
  const isAdmin = useHasRole('admin');

  // Not authenticated - show public header
  if (!isAuthenticated) {
    return <PageHeader title={props.title} />;
  }

  // Authenticated admin - show admin header
  if (isAdmin) {
    return <AdminHeader {...props} />;
  }

  // Authenticated regular user - show user header
  return <UserHeader {...props} />;
}