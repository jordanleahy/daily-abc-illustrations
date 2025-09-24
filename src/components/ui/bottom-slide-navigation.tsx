import { SlideToUnlock } from './slide-to-unlock';
import { cn } from '@/lib/utils';

interface BottomSlideNavigationProps {
  onSlide: () => void;
  disabled?: boolean;
  variant?: 'compact' | 'normal' | 'wide' | 'inline';
  slideText?: string;
  className?: string;
  show?: boolean;
}

/**
 * BottomSlideNavigation Component
 * 
 * A unified slide navigation component that provides consistent positioning,
 * styling, and behavior across all reading contexts. Supports both fixed
 * bottom positioning and inline placement.
 * 
 * Features:
 * - Consistent backdrop blur and border styling
 * - Configurable padding variants for different contexts
 * - Fixed positioning with safe-area support for mobile
 * - Optional inline positioning for embedded usage
 * - Conditional rendering support
 * 
 * @component
 * @example
 * // Fixed bottom navigation (most common)
 * <BottomSlideNavigation 
 *   onSlide={handleNext} 
 *   disabled={isLastPage}
 *   variant="normal"
 * />
 * 
 * @example
 * // Inline navigation for embedded contexts
 * <BottomSlideNavigation 
 *   onSlide={handleNext} 
 *   disabled={isLastPage}
 *   variant="inline"
 *   show={!isLastPage}
 * />
 */
export function BottomSlideNavigation({
  onSlide,
  disabled = false,
  variant = 'normal',
  slideText,
  className,
  show = true
}: BottomSlideNavigationProps) {
  // Don't render if show is false
  if (!show) {
    return null;
  }

  // Determine positioning and padding based on variant
  const isFixed = variant !== 'inline';
  const paddingClasses = {
    compact: 'py-4 px-4',
    normal: 'py-4 px-6', 
    wide: 'py-4 px-10',
    inline: 'px-24 pb-4'
  };

  const baseClasses = isFixed 
    ? "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t safe-area-inset-bottom"
    : "";

  const containerClasses = variant === 'compact' 
    ? "px-6" // Additional inner padding for compact variant
    : "";

  return (
    <div className={cn(baseClasses, paddingClasses[variant], className)}>
      <div className={containerClasses}>
        <SlideToUnlock 
          onUnlock={onSlide}
          disabled={disabled}
          className="w-full"
        />
      </div>
    </div>
  );
}