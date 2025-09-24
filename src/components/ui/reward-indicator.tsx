import { Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardIndicatorProps {
  className?: string;
  size?: number;
}

export function RewardIndicator({ className, size = 20 }: RewardIndicatorProps) {
  return (
    <Circle 
      className={cn("fill-amber-600 text-amber-700 animate-scale-in", className)}
      size={size}
    />
  );
}