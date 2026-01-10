import { memo } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles } from 'lucide-react';

/**
 * TrialBanner - Shows remaining trial days for users in their free trial period
 * 
 * Can be used as a page-level banner (inline) or as a header strip.
 * Only renders for authenticated users who are currently in an active trial.
 */
export const TrialBanner = memo(({ variant = 'inline' }: { variant?: 'inline' | 'strip' }) => {
  const { isInTrial, daysLeftInTrial, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading || !isInTrial) return null;

  const daysText = daysLeftInTrial === 1 ? 'day' : 'days';

  // Strip variant - thin banner for header use
  if (variant === 'strip') {
    return (
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="container mx-auto flex items-center justify-center gap-3 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-foreground">
            🎉 <strong>{daysLeftInTrial} {daysText}</strong> left in your free trial!
          </span>
          <Button 
            variant="link" 
            size="sm" 
            className="text-primary font-semibold p-0 h-auto"
            onClick={() => navigate('/pricing')}
          >
            Subscribe now →
          </Button>
        </div>
      </div>
    );
  }

  // Inline variant - card-style for page content
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-4 mb-6">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            🎉 You have <span className="font-bold text-primary">{daysLeftInTrial} {daysText}</span> left in your free trial!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enjoy full access to all library books and features.
          </p>
        </div>
        
        <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 px-2.5 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span>{daysLeftInTrial}d remaining</span>
        </div>
      </div>
    </div>
  );
});

TrialBanner.displayName = 'TrialBanner';
