import { ReactNode, ElementType } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  id?: string;
  title?: string;
  headerLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  variant?: 'default' | 'hero' | 'compact' | 'spacious' | 'full-width';
  className?: string;
}

const sectionVariants = {
  default: 'py-12 md:py-16',
  hero: 'py-6 md:py-12 min-h-[600px]',
  compact: 'py-8 md:py-10',
  spacious: 'py-16 md:py-24',
  'full-width': 'py-12 md:py-16'
};

const containerVariants = {
  default: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  hero: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  compact: 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8',
  spacious: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  'full-width': 'w-full'
};

export const Section = ({ 
  children, 
  id,
  title,
  headerLevel = 'h2',
  variant = 'default',
  className 
}: SectionProps) => {
  const HeaderTag = headerLevel as ElementType;

  return (
    <section
      id={id}
      className={cn(
        'w-full bg-background',
        sectionVariants[variant],
        id && 'scroll-mt-16', // Account for fixed headers
        className
      )}
    >
      <div className={containerVariants[variant]}>
        {title && (
          <HeaderTag className={cn(
            'font-bold text-foreground mb-8',
            headerLevel === 'h1' && 'text-4xl md:text-5xl',
            headerLevel === 'h2' && 'text-3xl md:text-4xl',
            headerLevel === 'h3' && 'text-2xl md:text-3xl',
            headerLevel === 'h4' && 'text-xl md:text-2xl',
            headerLevel === 'h5' && 'text-lg md:text-xl',
            headerLevel === 'h6' && 'text-base md:text-lg'
          )}>
            {title}
          </HeaderTag>
        )}
        {children}
      </div>
    </section>
  );
};