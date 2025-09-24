import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardIndicatorProps {
  className?: string;
  size?: number;
}

export function RewardIndicator({ className, size = 20 }: RewardIndicatorProps) {
  return (
    <Coins 
      className={cn("fill-amber-500 text-amber-500 animate-scale-in", className)}
      size={size}
    />
  );
}