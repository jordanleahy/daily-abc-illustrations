import { StandardPageLayout } from '@/components/layout';
import { AgentIdentityCard } from '@/components/agents/AgentIdentityCard';
import { ConfigurationTabs } from '@/components/agents/ConfigurationTabs';
import { AgentDocumentation } from '@/components/agents/AgentDocumentation';
import { AgeGroupsManager } from '@/components/agents/AgeGroupsManager';
import { TypeDiscoveriesManager } from '@/components/agents/TypeDiscoveriesManager';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentConfig } from '@/types/agent';
import { BookOpen, MessageCircle, Hash, Music, Palette, BookText, Shapes, ArrowLeftRight, Heart, PawPrint, Type, Moon, Blocks, Eye, AlertTriangle, FileText, Users, ListChecks } from 'lucide-react';
import { useState } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wand2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Agents = () => {
  const [selectedAgentType, setSelectedAgentType] = useState<AgentConfig['type']>('book-creation-abc');
  const [isStandardizing, setIsStandardizing] = useState(false);
  const [showAbcWarning, setShowAbcWarning] = useState(false);
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

  const handleStandardizeAgents = async () => {
    if (!userRole?.isAdmin) {
      toast.error('Admin access required');
      return;
    }

    setIsStandardizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('standardize-agents');
      
      if (error) throw error;
      
      const successCount = data.results.filter((r: any) => r.status === 'success').length;
      const errorCount = data.results.filter((r: any) => r.status === 'error').length;
      
      if (errorCount === 0) {
        toast.success(`Successfully standardized ${successCount} agents with 12-page structure`);
      } else {
        toast.warning(`Standardized ${successCount} agents. ${errorCount} failed.`);
      }
      
      // Refresh current agent config
      window.location.reload();
    } catch (error: any) {
      console.error('Standardization error:', error);
      toast.error(error.message || 'Failed to standardize agents');
    } finally {
      setIsStandardizing(false);
    }
  };

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
    },
    {
      type: 'book-creation-shapes',
      title: 'Shapes Book Agent',
      description: 'Expert at creating shape books teaching geometric recognition and spatial awareness.',
      icon: Shapes,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-opposites',
      title: 'Opposites Book Agent',
      description: 'Focused on teaching opposite concepts with clear visual comparisons.',
      icon: ArrowLeftRight,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-emotions',
      title: 'Emotions Book Agent',
      description: 'Specialized in emotional intelligence with relatable characters and scenarios.',
      icon: Heart,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-animals',
      title: 'Animals Book Agent',
      description: 'Expert in animal books with descriptions, habitats, sounds, and fun facts.',
      icon: PawPrint,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-first-words',
      title: 'First Words Book Agent',
      description: 'Builds foundational vocabulary with high-frequency words and clear illustrations.',
      icon: Type,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-bedtime',
      title: 'Bedtime Book Agent',
      description: 'Creates calming bedtime routines with soothing language and sequences.',
      icon: Moon,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-cvc',
      title: 'CVC Words Book Agent',
      description: 'Focused on early phonics with CVC word families and decodable words.',
      icon: Blocks,
      badge: 'Specialized'
    },
    {
      type: 'book-creation-sight-words',
      title: 'Sight Words Book Agent',
      description: 'Develops reading fluency with prominent sight word display and context.',
      icon: Eye,
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
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agent Configuration</h1>
              <p className="text-muted-foreground">
                Configure and manage your ABC Cards agent settings, instructions, and model parameters.
              </p>
            </div>
            {userRole?.isAdmin && (
              <Button
                onClick={handleStandardizeAgents}
                disabled={isStandardizing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {isStandardizing ? 'Standardizing...' : 'Standardize All Agents'}
              </Button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="agent" className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="agent" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Agent
            </TabsTrigger>
            <TabsTrigger value="age-groups" className="gap-2">
              <Users className="h-4 w-4" />
              Age Groups
            </TabsTrigger>
            <TabsTrigger value="discoveries" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Discoveries
            </TabsTrigger>
            <TabsTrigger value="documentation" className="gap-2">
              <FileText className="h-4 w-4" />
              Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="mt-6 space-y-8">
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
          </TabsContent>

          <TabsContent value="age-groups" className="mt-6">
            <AgeGroupsManager />
          </TabsContent>

          <TabsContent value="discoveries" className="mt-6">
            <TypeDiscoveriesManager />
          </TabsContent>

          <TabsContent value="documentation" className="mt-6">
            <AgentDocumentation />
          </TabsContent>
        </Tabs>

        {/* Status Footer - Fixed save button */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 p-5 bg-background border-2 border-primary rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">
                  💾 Unsaved Changes
                </p>
                <p className="text-xs text-muted-foreground">
                  Click save to persist changes to database
                </p>
              </div>
              <button
                onClick={() => {
                  if (selectedAgentType === 'book-creation-abc') {
                    setShowAbcWarning(true);
                  } else {
                    saveConfig();
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ABC Agent Warning Dialog */}
        <AlertDialog open={showAbcWarning} onOpenChange={setShowAbcWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                ABC Agent Warning
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  <strong>The ABC Agent is currently working well and has been carefully tuned.</strong>
                </p>
                <p>
                  Changes to this agent may break the 28-page book structure, cover/education page formatting, 
                  or letter case enforcement. Please ensure you've tested your changes thoroughly.
                </p>
                <p className="text-amber-600 font-medium">
                  Are you sure you want to save these changes?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  saveConfig();
                  setShowAbcWarning(false);
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Yes, Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </StandardPageLayout>
  );
};

export default Agents;