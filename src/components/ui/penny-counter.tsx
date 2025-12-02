import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPenniesAsCurrency } from '@/utils/currency';

interface PennyCounterProps {
  pennies: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function PennyCounter({ 
  pennies, 
  size = 'md', 
  showLabel = true,
  className 
}: PennyCounterProps) {
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

  return (
    <div className={cn("text-right", className)}>
      <div className="flex items-center gap-2 justify-end mb-1">
        <Coins className={cn(sizes.icon, "text-amber-500")} />
        <span className={cn(sizes.text, "font-bold")}>{formatPenniesAsCurrency(pennies)}</span>
      </div>
      {showLabel && (
        <p className={cn(sizes.label, "text-muted-foreground")}>Total Earned</p>
      )}
    </div>
  );
}

/**
 * @deprecated Use PennyCounter instead
 */
export { PennyCounter as CoinCounter };
