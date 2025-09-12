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
        className
      )}
      {...props}
    >
      {children}
      {isShimmering && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer bg-[length:200%_100%]" />
      )}
    </div>
  );
};