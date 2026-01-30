import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StandardPageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { AgentQuestionsManager } from '@/components/agents/AgentQuestionsManager';
import { AgentIdentityCard } from '@/components/agents/AgentIdentityCard';
import { ConfigurationTabs } from '@/components/agents/ConfigurationTabs';
import { useAgentConfig } from '@/hooks/useAgentConfig';
import { useUserRole } from '@/hooks/useUserRole';
import { getIconComponent } from '@/utils/iconMapping';
import { bookTypeToAgentType } from '@/utils/agentTypeUtils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen, Bot, MessageCircle } from 'lucide-react';
import type { DatabaseBookType } from '@/hooks/useBookTypes';

const AgentDetail = () => {
  const { bookTypeId } = useParams<{ bookTypeId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: userRole } = useUserRole();

  // Determine if this is a chat agent or book agent based on the route
  const isChat = location.pathname === '/agents/chat';

  // Fetch book type data if this is a book agent
  const { data: bookType, isLoading: isLoadingBookType } = useQuery({
    queryKey: ['book-type', bookTypeId],
    queryFn: async () => {
      if (!bookTypeId) return null;
      const { data, error } = await supabase
        .from('book_types')
        .select('*')
        .eq('id', bookTypeId)
        .single();
      if (error) throw error;
      return data as DatabaseBookType;
    },
    enabled: !!bookTypeId && !isChat,
  });

  // Derive agent type dynamically from database (after bookType is loaded)
  const derivedAgentType = isChat 
    ? 'chat' 
    : (bookType ? bookTypeToAgentType(bookType.id, bookType.agent_type_suffix) : 'chat');

  // Use the shared agent config hook
  const {
    config,
    isLoading: isAgentLoading,
    isInitialLoading,
    hasUnsavedChanges,
    lastChangeDescription,
    updateConfig,
    updateModelSettings,
    saveConfig,
    saveConfigWithOverrides,
    clearChangeDescription,
  } = useAgentConfig(derivedAgentType);

  // Toggle active mutation for book types
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('book_types')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-type', bookTypeId] });
      queryClient.invalidateQueries({ queryKey: ['book-types-admin'] });
      queryClient.invalidateQueries({ queryKey: ['book-types'] });
      toast.success('Status updated');
    },
  });

  // Show loading while any essential data is still loading
  const isLoading = isInitialLoading || isLoadingBookType;
  
  if (isLoading) {
    return (
      <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
        <LoadingState text="Loading agent configuration..." />
      </StandardPageLayout>
    );
  }

  // Only show "not found" if we're definitely done loading AND there's no config
  // For book types, we need the bookType data too
  if (!config && !isChat) {
    // If we have a bookTypeId but no config, the agent may not be set up yet
    // Allow proceeding if bookType exists - the page can still show info
    if (!bookType) {
      return (
        <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Book Type Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested book type could not be found.
            </p>
            <Button onClick={() => navigate('/agents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </div>
        </StandardPageLayout>
      );
    }
  }
  
  if (!config && isChat) {
    return (
      <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Agent Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested agent configuration could not be found.
          </p>
          <Button onClick={() => navigate('/agents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  const Icon = bookType ? getIconComponent(bookType.icon_name) : MessageCircle;

  return (
    <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          {/* Back button row */}
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 -ml-2"
            onClick={() => navigate('/agents')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Button>

          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10",
                  bookType?.color
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isChat ? 'Chat Agent' : bookType?.label || 'Book Agent'}
                </h1>
                <p className="text-muted-foreground text-sm max-w-lg">
                  {isChat 
                    ? 'Universal conversational agent for book creation' 
                    : bookType?.description || 'Book creation agent configuration'
                  }
                </p>
              </div>
            </div>

            {/* Right side: badges and toggle */}
            <div className="flex items-center gap-4 shrink-0">
              {bookType && (
                <>
                  <Badge variant="secondary" className="text-sm">
                    {bookType.expected_page_count || 12} pages
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="active-toggle" className="text-sm font-medium">
                      {bookType.is_active ? 'Active' : 'Inactive'}
                    </Label>
                    <Switch
                      id="active-toggle"
                      checked={bookType.is_active}
                      onCheckedChange={(checked) => {
                        toggleActiveMutation.mutate({ id: bookType.id, is_active: checked });
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Agent Questions Section */}
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Enabled Questions
            </h2>
            <p className="text-sm text-muted-foreground">
              Toggle which questions this agent will ask during book creation
            </p>
          </div>
          <AgentQuestionsManager agentType={derivedAgentType} embedded />
        </div>

        {/* Agent Identity & Configuration */}
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
          isLoading={isAgentLoading}
          hasUnsavedChanges={hasUnsavedChanges}
          agentType={derivedAgentType}
        />

        {/* Save Button */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 p-5 bg-background border-2 border-primary rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">
                  💾 Unsaved Changes
                </p>
                <p className="text-xs text-muted-foreground">
                  Click save to persist your changes
                </p>
              </div>
              <button
                onClick={() => saveConfig()}
                disabled={isAgentLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isAgentLoading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
};

export default AgentDetail;
