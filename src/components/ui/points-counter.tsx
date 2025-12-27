import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPoints } from '@/utils/currency';

interface PointsCounterProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function PointsCounter({ 
  points, 
  size = 'md', 
  showLabel = true,
  className 
}: PointsCounterProps) {
  const sizeClasses = {
    sm: {
      icon: 'h-4 w-4',
      text: 'text-xl',
      label: 'text-xs'
    },
    md: {
      icon: 'h-6 w-6',
      text: 'text-3xl',
      label: 'text-sm'
    },
    lg: {
      icon: 'h-8 w-8',
      text: 'text-4xl',
      label: 'text-base'
    }
  };

  const sizes = sizeClasses[size];
  const isNegative = points < 0;

  return (
    <div className={cn("text-right", className)}>
      <div className="flex items-center gap-2 justify-end mb-1">
        <Star className={cn(sizes.icon, isNegative ? "text-red-500" : "text-amber-500", "fill-current")} />
        <span className={cn(sizes.text, "font-bold", isNegative ? "text-red-500" : "text-foreground")}>{formatPoints(points)}</span>
      </div>
      {showLabel && (
        <p className={cn(sizes.label, "text-muted-foreground")}>Total Earned</p>
      )}
    </div>
  );
}

/**
 * @deprecated Use PointsCounter instead
 */
export { PointsCounter as PennyCounter };

/**
 * @deprecated Use PointsCounter instead
 */
export { PointsCounter as CoinCounter };
