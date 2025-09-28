import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PageLayout } from './PageLayout';
import { Container } from './Container';

interface StandardPageLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
  showHeader?: boolean;
  fullHeight?: boolean;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  containerClassName?: string;
}

export const StandardPageLayout = ({ 
  children, 
  title,
  className,
  showHeader = true,
  fullHeight = true,
  containerSize = 'lg',
  containerClassName
}: StandardPageLayoutProps) => {
  return (
    <PageLayout 
      title={title}
      className={className}
      showHeader={showHeader}
      fullHeight={fullHeight}
    >
      <Container size={containerSize} className={containerClassName}>
        {children}
      </Container>
    </PageLayout>
  );
};