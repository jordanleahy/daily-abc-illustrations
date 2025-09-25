import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContentProps {
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export const PageContent = ({ 
  children, 
  className,
  fullHeight = true
}: PageContentProps) => {
  return (
    <main className={cn(
      'flex-1 flex flex-col mt-6',
      fullHeight && 'min-h-[calc(100vh-3.5rem)]', // Account for header height
      className
    )}>
      {children}
    </main>
  );
};