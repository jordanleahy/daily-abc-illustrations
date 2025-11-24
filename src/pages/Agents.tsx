import { StandardPageLayout } from '@/components/layout';
import { AgentIdentityCard } from '@/components/agents/AgentIdentityCard';
import { ConfigurationTabs } from '@/components/agents/ConfigurationTabs';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentConfig } from '@/types/agent';
import { BookOpen, MessageCircle, Hash, Music, Palette, BookText } from 'lucide-react';
import { useState } from 'react';
import { LoadingState } from '@/components/ui/loading-state';

const Agents = () => {
  const [selectedAgentType, setSelectedAgentType] = useState<AgentConfig['type']>('chat');
  const { data: userRole } = useUserRole();
  
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

  const agentTypes: Array<{
    type: AgentConfig['type'];
    title: string;
    description: string;
    icon: any;
    badge?: string;
  }> = [
    {
      type: 'chat',
      title: 'Chat Agent',
      description: 'Universal planning assistant that gathers requirements and creates structured outlines for all 13 book types (ages 2-7).',
      icon: MessageCircle,
      badge: 'Active'
    },
    {
      type: 'book-creation',
      title: 'Generic Book Creation Agent',
      description: 'Fallback agent for creating educational ABC books when no specialized agent is available.',
      icon: BookOpen,
      badge: 'Fallback'
    },
    {
      type: 'book-creation-numbers',
      title: 'Numbers Book Agent',
      description: 'Specialized in creating number books with consistent counting objects and numeric digits.',
      icon: Hash,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-rhyming',
      title: 'Rhyming Book Agent',
      description: 'Expert in creating rhyming books with rhythmic language and consistent rhyme schemes.',
      icon: Music,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-colors',
      title: 'Colors Book Agent',
      description: 'Focused on color education with one color per page and child-friendly associations.',
      icon: Palette,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-abc',
      title: 'ABC Book Agent',
      description: 'Specialized in alphabet books with letter-focused educational content.',
      icon: BookText,
      badge: 'Specialized'
    }
  ];

  if (isInitialLoading) {
    return (
      <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
        <LoadingState text="Loading agent configuration..." />
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentTypes.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedAgentType === agent.type;
            
            return (
              <Card 
                key={agent.type}
                className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedAgentType(agent.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{agent.title}</CardTitle>
                      {agent.badge && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {agent.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {agent.description}
                  </p>
                  <Button 
                    variant={isSelected ? 'default' : 'outline'} 
                    size="sm" 
                    className="w-full"
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Agent Configuration Content */}
        {config ? (
          <>
            <AgentIdentityCard
              config={config}
              onUpdate={updateConfig}
              lastChangeDescription={lastChangeDescription}
              onClearChangeDescription={clearChangeDescription}
              isAdmin={userRole?.isAdmin ?? false}
            />
            
            <ConfigurationTabs
              config={config}
              onUpdate={updateConfig}
              onUpdateModelSettings={updateModelSettings}
              onSaveWithOverrides={saveConfigWithOverrides}
              isLoading={isLoading}
              hasUnsavedChanges={hasUnsavedChanges}
              agentType={selectedAgentType}
            />
          </>
        ) : (
          <div className="text-center space-y-4 py-8">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Agent Configuration Found</h3>
              <p className="text-muted-foreground">
                No {selectedAgentType} agent exists in your database.
              </p>
            </div>
          </div>
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
    </StandardPageLayout>
  );
};

export default Agents;