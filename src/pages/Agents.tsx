import { StandardPageLayout } from '@/components/layout';
import { AgentIdentityCard } from '@/components/agents/AgentIdentityCard';
import { ConfigurationTabs } from '@/components/agents/ConfigurationTabs';
import { AgentDocumentation } from '@/components/agents/AgentDocumentation';
import { AgeGroupsManager } from '@/components/agents/AgeGroupsManager';
import { TypeDiscoveriesManager } from '@/components/agents/TypeDiscoveriesManager';
import { CharacterThemesManager } from '@/components/agents/CharacterThemesManager';
import { BookAgentsManager } from '@/components/agents/BookAgentsManager';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, MessageCircle, AlertTriangle, FileText, Users, ListChecks, Sparkles, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [isStandardizing, setIsStandardizing] = useState(false);
  const [showAbcWarning, setShowAbcWarning] = useState(false);
  const { data: userRole } = useUserRole();
  
  // Chat agent config for the dedicated Chat Agent tab
  const {
    config: chatConfig,
    isLoading: isChatLoading,
    isInitialLoading,
    hasUnsavedChanges: chatHasUnsavedChanges,
    lastChangeDescription: chatLastChangeDescription,
    updateConfig: updateChatConfig,
    updateModelSettings: updateChatModelSettings,
    saveConfig: saveChatConfig,
    saveConfigWithOverrides: saveChatConfigWithOverrides,
    clearChangeDescription: clearChatChangeDescription,
  } = useAgentConfig('chat');

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
                Configure and manage your AI agents, book types, and shared configuration.
              </p>
            </div>
            {userRole?.isAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate('/agents/create')}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Agent
                </Button>
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
              </div>
            )}
          </div>
        </div>

        {/* Main Tabs - Consolidated from 6 to 6 with better organization */}
        <Tabs defaultValue="book-agents" className="w-full">
          <TabsList className="flex w-full max-w-4xl overflow-x-auto scrollbar-hide touch-pan-x">
            <TabsTrigger value="book-agents" className="flex items-center gap-1.5 flex-shrink-0 px-3 text-xs min-h-[44px] whitespace-nowrap">
              <BookOpen className="h-3.5 w-3.5" />
              Books
            </TabsTrigger>
            <TabsTrigger value="chat-agent" className="flex items-center gap-1.5 flex-shrink-0 px-3 text-xs min-h-[44px] whitespace-nowrap">
              <MessageCircle className="h-3.5 w-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="age-groups" className="flex items-center gap-1.5 flex-shrink-0 px-3 text-xs min-h-[44px] whitespace-nowrap">
              <Users className="h-3.5 w-3.5" />
              Ages
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center gap-1.5 flex-shrink-0 px-3 text-xs min-h-[44px] whitespace-nowrap">
              <Sparkles className="h-3.5 w-3.5" />
              Themes
            </TabsTrigger>
            <TabsTrigger value="discoveries" className="flex items-center gap-1.5 flex-shrink-0 px-3 text-xs min-h-[44px] whitespace-nowrap">
              <ListChecks className="h-3.5 w-3.5" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-1.5 flex-shrink-0 px-3 text-xs min-h-[44px] whitespace-nowrap">
              <FileText className="h-3.5 w-3.5" />
              Docs
            </TabsTrigger>
          </TabsList>

          {/* Book Agents Tab - Unified view of book types + their linked agents */}
          <TabsContent value="book-agents" className="mt-6">
            <BookAgentsManager />
          </TabsContent>

          {/* Chat Agent Tab - Standalone configuration for the universal chat agent */}
          <TabsContent value="chat-agent" className="mt-6 space-y-8">
            {chatConfig ? (
              <>
                <AgentIdentityCard
                  config={chatConfig}
                  onUpdate={updateChatConfig}
                  lastChangeDescription={chatLastChangeDescription}
                  onClearChangeDescription={clearChatChangeDescription}
                  isAdmin={userRole?.isAdmin ?? false}
                />
                
                <ConfigurationTabs
                  config={chatConfig}
                  onUpdate={updateChatConfig}
                  onUpdateModelSettings={updateChatModelSettings}
                  onSaveWithOverrides={saveChatConfigWithOverrides}
                  isLoading={isChatLoading}
                  hasUnsavedChanges={chatHasUnsavedChanges}
                  agentType="chat"
                />
              </>
            ) : (
              <div className="text-center space-y-4 py-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">No Chat Agent Found</h3>
                  <p className="text-muted-foreground">
                    The universal Chat Agent doesn't exist in your database.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="age-groups" className="mt-6">
            <AgeGroupsManager />
          </TabsContent>

          <TabsContent value="characters" className="mt-6">
            <CharacterThemesManager />
          </TabsContent>

          <TabsContent value="discoveries" className="mt-6">
            <TypeDiscoveriesManager />
          </TabsContent>

          <TabsContent value="documentation" className="mt-6">
            <AgentDocumentation />
          </TabsContent>
        </Tabs>

        {/* Status Footer - Fixed save button for Chat Agent tab */}
        {chatHasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 p-5 bg-background border-2 border-primary rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">
                  💾 Unsaved Changes
                </p>
                <p className="text-xs text-muted-foreground">
                  Click save to persist Chat Agent changes
                </p>
              </div>
              <button
                onClick={() => saveChatConfig()}
                disabled={isChatLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isChatLoading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}

        {/* ABC Agent Warning Dialog - kept for future use if needed */}
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
