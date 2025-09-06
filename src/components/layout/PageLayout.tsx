import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PageHeader } from './PageHeader';
import { PageContent } from './PageContent';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
  showHeader?: boolean;
  fullHeight?: boolean;
}

export const PageLayout = ({ 
  children, 
  title,
  className,
  showHeader = true,
  fullHeight = true
}: PageLayoutProps) => {
  return (
    <div className={cn('min-h-screen bg-background flex flex-col', className)}>
      {showHeader && <PageHeader title={title} />}
      <PageContent fullHeight={fullHeight}>
        {children}
      </PageContent>
    </div>
  );
};