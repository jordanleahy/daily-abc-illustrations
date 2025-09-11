import { PageLayout } from '@/components/layout';
import { Container } from '@/components/layout';
import { AgentIdentityCard } from '@/components/agents/AgentIdentityCard';
import { ConfigurationTabs } from '@/components/agents/ConfigurationTabs';
import { useAgentConfig } from '@/hooks/useAgentConfig';

const Agents = () => {
  const {
    config,
    isLoading,
    hasUnsavedChanges,
    updateConfig,
    updateModelSettings,
    saveConfig,
  } = useAgentConfig();

  return (
    <PageLayout title="Agent Configuration" showHeader={true}>
      <Container size="xl" className="py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Agent Configuration</h1>
            <p className="text-muted-foreground">
              Configure and manage your ABC Cards agent settings, instructions, and model parameters.
            </p>
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