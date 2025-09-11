import { PageLayout } from '@/components/layout';
import { Container } from '@/components/layout';
import { AgentIdentityCard } from '@/components/agents/AgentIdentityCard';
import { ConfigurationTabs } from '@/components/agents/ConfigurationTabs';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { Button } from '@/components/ui/button';
import { testAgentIntegration, testRLSPolicies } from '@/utils/testAgentIntegration';
import { useToast } from '@/hooks/use-toast';

const Agents = () => {
  const {
    config,
    isLoading,
    isInitialLoading,
    hasUnsavedChanges,
    updateConfig,
    updateModelSettings,
    saveConfig,
  } = useAgentConfig();
  const { toast } = useToast();

  const runIntegrationTest = async () => {
    const result = await testAgentIntegration();
    toast({
      title: result.success ? "Integration Test Passed" : "Integration Test Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  const runRLSTest = async () => {
    const result = await testRLSPolicies();
    toast({
      title: result.success ? "RLS Test Passed" : "RLS Test Failed", 
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
  };

  if (isInitialLoading) {
    return (
      <PageLayout title="Agent Configuration" showHeader={true}>
        <Container size="xl" className="py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading agent configuration...</p>
            </div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Agent Configuration" showHeader={true}>
      <Container size="xl" className="py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Agent Configuration</h1>
                <p className="text-muted-foreground">
                  Configure and manage your ABC Cards agent settings, instructions, and model parameters.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={runRLSTest}
                  size="sm"
                >
                  Test RLS
                </Button>
                <Button 
                  variant="outline" 
                  onClick={runIntegrationTest}
                  size="sm"
                >
                  Test Backend
                </Button>
              </div>
            </div>
          </div>

          {/* Agent Identity Card */}
          <AgentIdentityCard
            config={config}
            onUpdate={updateConfig}
          />

          {/* Configuration Tabs */}
          <ConfigurationTabs
            config={config}
            onUpdate={updateConfig}
            onUpdateModelSettings={updateModelSettings}
            onSave={saveConfig}
            isLoading={isLoading}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          {/* Status Footer */}
          {hasUnsavedChanges && (
            <div className="fixed bottom-4 right-4 p-4 bg-background border border-border rounded-lg shadow-lg">
              <p className="text-sm text-muted-foreground mb-2">
                You have unsaved changes
              </p>
              <button
                onClick={saveConfig}
                disabled={isLoading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save all changes'}
              </button>
            </div>
          )}
        </div>
      </Container>
    </PageLayout>
  );
};

export default Agents;