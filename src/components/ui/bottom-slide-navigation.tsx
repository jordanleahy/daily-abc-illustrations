import { ArrowNavigation } from './arrow-navigation';
import { cn } from '@/lib/utils';

interface BottomSlideNavigationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  /** @deprecated Use onNext instead */
  onSlide?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
  /** @deprecated Use disableNext instead */
  disabled?: boolean;
  variant?: 'compact' | 'normal' | 'wide' | 'inline';
  /** @deprecated Not used in arrow navigation */
  slideText?: string;
  className?: string;
  show?: boolean;
}

/**
 * BottomSlideNavigation Component
 * 
 * A unified arrow navigation component that provides consistent positioning,
 * styling, and behavior across all reading contexts. Supports both fixed
 * bottom positioning and inline placement with bidirectional navigation.
 * 
 * Features:
 * - Bidirectional navigation (previous/next)
 * - Consistent backdrop blur and border styling
 * - Configurable padding variants for different contexts
 * - Fixed positioning with safe-area support for mobile
 * - Optional inline positioning for embedded usage
 * - Conditional rendering support
 * 
 * @component
 * @example
 * // Fixed bottom navigation with both directions
 * <BottomSlideNavigation 
 *   onPrevious={handlePrevious}
 *   onNext={handleNext}
 *   disablePrevious={isFirstPage}
 *   disableNext={isLastPage}
 *   variant="normal"
 * />
 * 
 * @example
 * // Inline navigation for embedded contexts
 * <BottomSlideNavigation 
 *   onNext={handleNext}
 *   disableNext={isLastPage}
 *   variant="inline"
 *   show={!isLastPage}
 * />
 */
export function BottomSlideNavigation({
  onPrevious,
  onNext,
  onSlide, // Backward compatibility
  disablePrevious = false,
  disableNext = false,
  disabled = false, // Backward compatibility
  variant = 'normal',
  slideText, // Ignored in arrow navigation
  className,
  show = true
}: BottomSlideNavigationProps) {
  // Don't render if show is false
  if (!show) {
    return null;
  }

  // Backward compatibility: onSlide maps to onNext
  const handleNext = onNext || onSlide;
  const isNextDisabled = disableNext || disabled;

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
        <ArrowNavigation 
          onPrevious={onPrevious}
          onNext={handleNext}
          disablePrevious={disablePrevious}
          disableNext={isNextDisabled}
          className="w-full"
        />
      </div>
    </div>
  );
}