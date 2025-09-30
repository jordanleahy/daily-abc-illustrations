import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinCounterProps {
  coins: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function CoinCounter({ 
  coins, 
  size = 'md', 
  showLabel = true,
  className 
}: CoinCounterProps) {
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
        <span className={cn(sizes.text, "font-bold")}>{coins}</span>
      </div>
      {showLabel && (
        <p className={cn(sizes.label, "text-muted-foreground")}>Total Coins</p>
      )}
    </div>
  );
}
