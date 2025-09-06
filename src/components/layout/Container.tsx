import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const containerSizes = {
  sm: 'max-w-2xl',     // ~672px - Good for reading content
  md: 'max-w-4xl',     // ~896px - Forms, cards
  lg: 'max-w-6xl',     // ~1152px - Dashboards, tables  
  xl: 'max-w-7xl',     // ~1280px - Wide layouts
  full: 'max-w-none'   // Full width - Canvas, media
};

export const Container = ({ 
  children, 
  size = 'lg', 
  className 
}: ContainerProps) => {
  return (
    <div className={cn(
      // Base responsive padding with full breakpoint coverage
      'mx-auto w-full',
      'px-4',           // Mobile: 16px sides
      'sm:px-6',        // Small: 24px sides (≥640px)
      'md:px-8',        // Medium: 32px sides (≥768px) 
      'lg:px-8',        // Large: 32px sides (≥1024px)
      'xl:px-12',       // X-Large: 48px sides (≥1280px)
      '2xl:px-16',      // 2X-Large: 64px sides (≥1536px)
      containerSizes[size],
      className
    )}>
      {children}
    </div>
  );
};