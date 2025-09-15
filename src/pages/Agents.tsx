import { PageLayout } from '@/components/layout';
import { Container } from '@/components/layout';
import { AgentIdentityCard } from '@/components/agents/AgentIdentityCard';
import { ConfigurationTabs } from '@/components/agents/ConfigurationTabs';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AGENT_TYPE_CONFIGS, AgentConfig } from '@/types/agent';
import { BookOpen, MessageCircle, PenTool, Palette } from 'lucide-react';
import { useState } from 'react';

const Agents = () => {
  const [selectedAgentType, setSelectedAgentType] = useState<AgentConfig['type']>('chat');
  
  const {
    config,
    isLoading,
    isInitialLoading,
    hasUnsavedChanges,
    lastChangeDescription,
    updateConfig,
    updateModelSettings,
    saveConfig,
    saveConfigWithOverrides,
    clearChangeDescription,
  } = useAgentConfig(selectedAgentType);


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
            </div>
          </div>

          {/* Agent Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedAgentType === 'chat' ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Chat Agent</CardTitle>
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  General purpose conversational AI for answering questions and providing assistance.
                </p>
                <Button 
                  variant={selectedAgentType === 'chat' ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedAgentType('chat')}
                >
                  {selectedAgentType === 'chat' ? 'Currently Active' : 'Switch to Chat Agent'}
                </Button>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedAgentType === 'book-creation' ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/10">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Book Creation Agent</CardTitle>
                    <Badge variant="secondary" className="text-xs">New</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Specialized AI that converts conversations into educational ABC books for children.
                </p>
                <Button 
                  variant={selectedAgentType === 'book-creation' ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedAgentType('book-creation')}
                >
                  {selectedAgentType === 'book-creation' ? 'Currently Active' : 'Switch to Book Agent'}
                </Button>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedAgentType === 'illustration-director' ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-500/10">
                    <Palette className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Illustration Director</CardTitle>
                    <Badge variant="secondary" className="text-xs">New</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Creates visual style guides and system prompts for book illustrations to ensure consistency.
                </p>
                <Button 
                  variant={selectedAgentType === 'illustration-director' ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedAgentType('illustration-director')}
                >
                  {selectedAgentType === 'illustration-director' ? 'Currently Active' : 'Switch to Director'}
                </Button>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedAgentType === 'graphic-designer' ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <PenTool className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Graphics Designer</CardTitle>
                    <Badge variant="secondary" className="text-xs">New</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generates detailed image prompts from style guides and page content for consistent illustrations.
                </p>
                <Button 
                  variant={selectedAgentType === 'graphic-designer' ? 'default' : 'outline'} 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedAgentType('graphic-designer')}
                >
                  {selectedAgentType === 'graphic-designer' ? 'Currently Active' : 'Switch to Graphics Designer'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Agent Identity Card */}
          {config && (
            <AgentIdentityCard
              config={config}
              onUpdate={updateConfig}
              lastChangeDescription={lastChangeDescription}
              onClearChangeDescription={clearChangeDescription}
            />
          )}

          {/* Configuration Tabs */}
          {config && (
            <ConfigurationTabs
              config={config}
              onUpdate={updateConfig}
              onUpdateModelSettings={updateModelSettings}
              onSaveWithOverrides={saveConfigWithOverrides}
              isLoading={isLoading}
              hasUnsavedChanges={hasUnsavedChanges}
              agentType={selectedAgentType}
            />
          )}

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