import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  isShimmering?: boolean;
  variant?: 'default' | 'skeleton' | 'blur-up' | 'progress';
  skeletonType?: 'text' | 'card' | 'image' | 'custom';
  progress?: number; // 0-100 for progress variant
  blurDataURL?: string;
}

interface SkeletonLayoutProps {
  type: 'text' | 'card' | 'image' | 'custom';
  className?: string;
}

const SkeletonLayout = ({ type, className }: SkeletonLayoutProps) => {
  switch (type) {
    case 'text':
      return (
        <div className={cn("space-y-3", className)}>
          <div className="h-4 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 bg-muted/60 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted/60 rounded animate-pulse w-4/6" />
        </div>
      );
    case 'card':
      return (
        <div className={cn("space-y-4", className)}>
          <div className="h-48 bg-muted/60 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 bg-muted/60 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted/60 rounded animate-pulse" />
            <div className="h-4 bg-muted/60 rounded animate-pulse w-5/6" />
          </div>
        </div>
      );
    case 'image':
      return (
        <div className={cn("aspect-video bg-muted/60 rounded animate-pulse", className)} />
      );
    default:
      return (
        <div className={cn("h-full bg-muted/60 rounded animate-pulse", className)} />
      );
  }
};

const ProgressiveShimmer = ({ progress = 0, className }: { progress: number; className?: string }) => {
  return (
    <div className={cn("relative overflow-hidden bg-muted/30 rounded", className)}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Progressive shimmer effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-shimmer bg-[length:300%_100%]"
        style={{ opacity: Math.max(0.1, 1 - progress / 100) }}
      />
      
      {/* Progress percentage */}
      {progress > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  );
};

const BlurUpShimmer = ({ blurDataURL, className }: { blurDataURL: string; className?: string }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      <img
        src={blurDataURL}
        alt=""
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 blur-sm scale-110",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      
      {/* Shimmer overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer bg-[length:300%_100%] transition-opacity duration-500",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

export const Shimmer = ({ 
  className, 
  children, 
  isShimmering = false,
  variant = 'default',
  skeletonType = 'custom',
  progress = 0,
  blurDataURL,
  ...props 
}: ShimmerProps) => {
  // Handle different shimmer variants
  const renderShimmerContent = () => {
    switch (variant) {
      case 'skeleton':
        return <SkeletonLayout type={skeletonType} className={className} />;
      
      case 'progress':
        return <ProgressiveShimmer progress={progress} className={className} />;
      
      case 'blur-up':
        return blurDataURL ? (
          <BlurUpShimmer blurDataURL={blurDataURL} className={className} />
        ) : (
          <div className={cn("h-full bg-muted/60 rounded animate-pulse", className)} />
        );
      
      default:
        return (
          <>
            {children}
            {isShimmering && (
              <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-shimmer bg-[length:300%_100%] opacity-90" />
            )}
          </>
        );
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isShimmering && variant === 'default' && "ring-2 ring-primary/50",
        variant !== 'default' && className
      )}
      {...props}
    >
      {renderShimmerContent()}
    </div>
  );
};