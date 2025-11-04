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
        "relative overflow-hidden transition-all duration-300 bg-muted/30",
        isShimmering && "ring-2 ring-primary shadow-lg shadow-primary/20",
        className
      )}
      {...props}
    >
      {children}
      {isShimmering && (
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-shimmer bg-[length:200%_100%] opacity-100" />
      )}
    </div>
  );
};