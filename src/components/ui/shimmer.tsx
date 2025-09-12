import { cn } from '@/lib/utils';

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  isShimmering?: boolean;
}

export const Shimmer = ({ className, children, isShimmering = false, ...props }: ShimmerProps) => {
  return (
    <div 
      className={cn(
        "transition-all duration-300",
        isShimmering && "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};