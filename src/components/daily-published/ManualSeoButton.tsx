import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useManualSeoGeneration } from '@/hooks/useManualSeoGeneration';

interface ManualSeoButtonProps {
  dailyPublishedId: string;
  disabled?: boolean;
}

export const ManualSeoButton = ({ dailyPublishedId, disabled }: ManualSeoButtonProps) => {
  const manualSeoGeneration = useManualSeoGeneration();

  const handleGenerateSeo = () => {
    manualSeoGeneration.mutate({ dailyPublishedId });
  };

  return (
    <Button
      onClick={handleGenerateSeo}
      disabled={disabled || manualSeoGeneration.isPending}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${manualSeoGeneration.isPending ? 'animate-spin' : ''}`} />
      {manualSeoGeneration.isPending ? 'Generating SEO...' : 'Generate SEO'}
    </Button>
  );
};