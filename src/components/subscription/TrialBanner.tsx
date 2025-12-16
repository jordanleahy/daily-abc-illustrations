import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

export function TrialBanner() {
  const { isInTrial, daysLeftInTrial, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading || !isInTrial) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="container mx-auto flex items-center justify-center gap-3 text-sm">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-foreground">
          🎉 <strong>{daysLeftInTrial} days</strong> left in your free trial!
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
