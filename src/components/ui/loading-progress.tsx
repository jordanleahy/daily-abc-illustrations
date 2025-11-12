import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingStep {
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

interface LoadingProgressProps {
  steps: LoadingStep[];
  className?: string;
}

export function LoadingProgress({ steps, className }: LoadingProgressProps) {
  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center mb-6">Loading Book</h3>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  step.status === 'loading' && "bg-primary/10",
                  step.status === 'complete' && "bg-muted/50"
                )}
              >
                <div className="flex-shrink-0">
                  {step.status === 'pending' && (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  {step.status === 'loading' && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {step.status === 'complete' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {step.status === 'error' && (
                    <Circle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    step.status === 'pending' && "text-muted-foreground",
                    step.status === 'loading' && "text-primary",
                    step.status === 'complete' && "text-foreground",
                    step.status === 'error' && "text-destructive"
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
