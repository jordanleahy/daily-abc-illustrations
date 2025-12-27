import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardIndicatorProps {
  className?: string;
  size?: number;
}

export function RewardIndicator({ className, size = 20 }: RewardIndicatorProps) {
  return (
    <Star 
      className={cn("fill-amber-500 text-amber-600 animate-scale-in", className)}
      size={size}
    />
  );
}
