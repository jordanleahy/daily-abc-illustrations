import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { PageContent } from './PageContent';
import { Footer } from '@/components/landing/Footer';
import { useAuthContext } from '@/contexts/AuthContext';
import { TrialBanner } from '@/components/subscription/TrialBanner';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
  showHeader?: boolean;
  fullHeight?: boolean;
  onMobileMenuToggle?: () => void;
  showReviewButton?: boolean;
  onReviewClick?: () => void;
  reviewButtonVariant?: 'review' | 'view-book';
}

export const PageLayout = ({ 
  children, 
  title,
  className,
  showHeader = true,
  fullHeight = true,
  onMobileMenuToggle,
  showReviewButton,
  onReviewClick,
  reviewButtonVariant
}: PageLayoutProps) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuthContext();
  
  const isPublicBookPage = location.pathname.startsWith('/book/');
  const shouldShowFooter = !isAuthenticated && !loading && !isPublicBookPage && location.pathname !== '/auth' && location.pathname !== '/snow';
  
  return (
    <div className={cn('min-h-screen bg-background flex flex-col overflow-x-hidden', className)}>
      {showHeader && (
        <Header 
          title={title} 
          onMobileMenuToggle={onMobileMenuToggle}
          showReviewButton={showReviewButton}
          onReviewClick={onReviewClick}
          reviewButtonVariant={reviewButtonVariant}
        />
      )}
      <TrialBanner />
      <PageContent fullHeight={fullHeight}>
        {children}
      </PageContent>
      {shouldShowFooter && <Footer />}
    </div>
  );
};