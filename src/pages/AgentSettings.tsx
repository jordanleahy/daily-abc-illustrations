import { useNavigate } from 'react-router-dom';
import { StandardPageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { AgentDocumentation } from '@/components/agents/AgentDocumentation';
import { ArrowLeft, FileText } from 'lucide-react';

const AgentSettings = () => {
  const navigate = useNavigate();

  return (
    <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/agents')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Agent Documentation
            </h1>
            <p className="text-muted-foreground text-sm">
              View documentation for agent configuration and usage
            </p>
          </div>
        </div>

        {/* Documentation */}
        <AgentDocumentation />
      </div>
    </StandardPageLayout>
  );
};

export default AgentSettings;
