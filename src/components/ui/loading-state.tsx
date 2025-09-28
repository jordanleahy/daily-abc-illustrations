import { cn } from '@/lib/utils';

interface LoadingStateProps {
  text?: string;
  className?: string;
  spinnerSize?: string;
}

export const LoadingState = ({ 
  text = "Loading...", 
  className,
  spinnerSize = "h-8 w-8"
}: LoadingStateProps) => {
  return (
    <div className={cn("text-center py-8", className)}>
      <div className={cn("animate-spin rounded-full border-b-2 border-primary mx-auto", spinnerSize)} />
      <p className="text-muted-foreground mt-2">{text}</p>
    </div>
  );
};