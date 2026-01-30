import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { useUserRole } from '@/hooks/useUserRole';
import { getIconComponent } from '@/utils/iconMapping';
import { bookTypeToAgentType } from '@/utils/agentTypeUtils';
import { cn } from '@/lib/utils';
import { Plus, Bot, MessageCircle, Settings, HelpCircle } from 'lucide-react';
import type { DatabaseBookType } from '@/hooks/useBookTypes';

interface AgentData {
  id: string;
  name: string;
  type: string;
  operational_status: string;
}

const AgentSelect = () => {
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();

  // Fetch book types
  const { data: bookTypes, isLoading: isLoadingBookTypes } = useQuery({
    queryKey: ['book-types-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_types')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as DatabaseBookType[];
    },
  });

  // Fetch all latest book creation agents
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents-book-creation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, type, operational_status')
        .eq('is_latest', true)
        .like('type', 'book-creation%');
      if (error) throw error;
      return data as AgentData[];
    },
  });

  // Fetch chat agent
  const { data: chatAgent } = useQuery({
    queryKey: ['agents-chat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, type, operational_status')
        .eq('is_latest', true)
        .eq('type', 'chat')
        .single();
      if (error) return null;
      return data as AgentData;
    },
  });

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  if (isLoadingBookTypes || isLoadingAgents) {
    return (
      <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
        <LoadingState text="Loading agents..." />
      </StandardPageLayout>
    );
  }

  // Build agent cards data using dynamic mapping from database
  const bookAgentCards = (bookTypes || []).map(bt => {
    const agentType = bookTypeToAgentType(bt.id, bt.agent_type_suffix);
    const agent = agents?.find(a => a.type === agentType) || null;
    return { bookType: bt, agent, type: 'book' as const };
  });

  return (
    <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agent Configuration</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Select an agent to configure its settings and questions
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/agents/settings')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              {userRole?.isAdmin && (
                <Button
                  onClick={() => navigate('/agents/create')}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Agent</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Orchestration Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Orchestration
          </h2>
          <div className="space-y-3">
            {/* Chat Agent Card */}
            {chatAgent && (
              <Card 
                className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 group"
                onClick={() => navigate('/agents/chat')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <MessageCircle className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{chatAgent.name}</h3>
                        <div 
                          className={cn("w-2 h-2 rounded-full", getStatusColor(chatAgent.operational_status))} 
                          title={chatAgent.operational_status}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Manages conversations, asks questions, coordinates with book agents
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">Orchestrator</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Questions Card */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 group"
              onClick={() => navigate('/agents/questions')}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/50 group-hover:bg-accent transition-colors">
                    <HelpCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">All Questions</h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage all discovery questions used by agents
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">Registry</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Book Agents Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Book Creation Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookAgentCards.map(({ bookType, agent }) => {
              const Icon = getIconComponent(bookType.icon_name);
              const isActive = bookType.is_active;

              return (
                <Card 
                  key={bookType.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg group",
                    isActive 
                      ? "hover:border-primary/30" 
                      : "opacity-60 hover:opacity-80"
                  )}
                  onClick={() => navigate(`/agents/book/${bookType.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div 
                        className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-xl transition-colors",
                          isActive 
                            ? "bg-primary/10 group-hover:bg-primary/20" 
                            : "bg-muted",
                          bookType.color
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{bookType.label}</h3>
                          {!isActive && (
                            <Badge variant="outline" className="text-xs">Disabled</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs font-normal">
                            {bookType.expected_page_count || 12} pages
                          </Badge>
                          {agent && (
                            <div className="flex items-center gap-1.5">
                              <Bot className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{agent.name}</span>
                              <div 
                                className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(agent.operational_status))} 
                              />
                            </div>
                          )}
                        </div>
                        {bookType.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {bookType.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
};

export default AgentSelect;
