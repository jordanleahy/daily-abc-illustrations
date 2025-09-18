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
        "relative overflow-hidden transition-all duration-300",
        isShimmering && "ring-2 ring-primary/50",
        className
      )}
      {...props}
    >
      {children}
      {isShimmering && (
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-primary/70 to-transparent animate-shimmer bg-[length:300%_100%] opacity-90" />
      )}
    </div>
  );
};