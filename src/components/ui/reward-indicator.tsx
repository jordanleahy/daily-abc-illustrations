import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardIndicatorProps {
  className?: string;
  size?: number;
}

export function RewardIndicator({ className, size = 20 }: RewardIndicatorProps) {
  return (
    <Star 
      className={cn("fill-yellow-400 text-yellow-400 animate-scale-in", className)}
      size={size}
    />
  );
}