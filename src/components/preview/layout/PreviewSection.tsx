import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PreviewSectionProps {
  children: ReactNode;
  variant?: 'hero' | 'default' | 'feature' | 'explainer' | 'cta';
  id?: string;
  className?: string;
}

const variantStyles = {
  hero: 'py-16 md:py-24 bg-gradient-to-b from-background to-muted/30',
  default: 'py-12 md:py-16',
  feature: 'py-16 md:py-20',
  explainer: 'py-12 md:py-16 bg-muted/30',
  cta: 'py-16 md:py-20 bg-gradient-to-b from-muted/30 to-background'
};

export const PreviewSection = ({ 
  children, 
  variant = 'default',
  id,
  className 
}: PreviewSectionProps) => {
  return (
    <section
      id={id}
      className={cn(
        'w-full',
        variantStyles[variant],
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
};
