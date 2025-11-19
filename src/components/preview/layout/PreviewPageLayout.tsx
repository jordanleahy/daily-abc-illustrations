import { ReactNode } from 'react';
import { PreviewNav } from './PreviewNav';
import { PreviewFooter } from './PreviewFooter';

interface PreviewPageLayoutProps {
  children: ReactNode;
}

export const PreviewPageLayout = ({ children }: PreviewPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PreviewNav />
      <main className="flex-1">
        {children}
      </main>
      <PreviewFooter />
    </div>
  );
};
