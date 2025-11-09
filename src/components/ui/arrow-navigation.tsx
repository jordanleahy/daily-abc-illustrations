import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArrowNavigationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  className?: string;
}

/**
 * ArrowNavigation Component
 * 
 * A simple, intuitive navigation bar with left and right arrow buttons.
 * Replaces the slide-to-unlock pattern with direct tap navigation.
 * 
 * Features:
 * - Bidirectional navigation (previous/next)
 * - Individual disable states for each direction
 * - Clean, dark design with rounded edges
 * - Hover states for better UX
 * - Touch-friendly button areas
 * 
 * @component
 * @example
 * <ArrowNavigation 
 *   onPrevious={handlePrevious}
 *   onNext={handleNext}
 *   disablePrevious={isFirstPage}
 *   disableNext={isLastPage}
 * />
 */
export function ArrowNavigation({
  onPrevious,
  onNext,
  disablePrevious = false,
  disableNext = false,
  className
}: ArrowNavigationProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between h-11 bg-secondary/90 backdrop-blur-sm rounded-full border border-border/50",
        "select-none touch-none",
        className
      )}
      style={{ touchAction: 'none' }}
    >
      {/* Previous/Left Arrow */}
      <button
        onClick={onPrevious}
        disabled={disablePrevious || !onPrevious}
        className={cn(
          "flex items-center justify-center h-full w-16 rounded-l-full transition-colors",
          "active:scale-95 transition-transform",
          disablePrevious || !onPrevious
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-muted/50 cursor-pointer"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>

      {/* Center spacer */}
      <div className="flex-1" />

      {/* Next/Right Arrow */}
      <button
        onClick={onNext}
        disabled={disableNext || !onNext}
        className={cn(
          "flex items-center justify-center h-full w-16 rounded-r-full transition-colors",
          "active:scale-95 transition-transform",
          disableNext || !onNext
            ? "opacity-30 cursor-not-allowed"
            : "hover:bg-muted/50 cursor-pointer"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>
    </div>
  );
}
