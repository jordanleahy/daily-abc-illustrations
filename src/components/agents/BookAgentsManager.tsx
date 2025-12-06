import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Link2, BookOpen, Bot, Loader2 } from 'lucide-react';
import { getIconComponent, getAvailableIconNames } from '@/utils/iconMapping';
import { BOOK_TYPE_TO_AGENT_TYPE } from '@/types/shared/agent';
import type { DatabaseBookType } from '@/hooks/useBookTypes';
import { cn } from '@/lib/utils';

interface AgentData {
  id: string;
  name: string;
  type: string;
  intent: string;
  instructions: string;
  operational_status: string;
  model: string;
  max_completion_tokens: number;
  top_p: number;
  version: string;
  is_latest: boolean;
}

interface BookAgentPair {
  bookType: DatabaseBookType;
  agent: AgentData | null;
}

export function BookAgentsManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<BookAgentPair | null>(null);

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
        .select('*')
        .eq('is_latest', true)
        .like('type', 'book-creation%');
      if (error) throw error;
      return data as AgentData[];
    },
  });

  // Join book types with their agents
  const bookAgentPairs: BookAgentPair[] = (bookTypes || []).map(bt => {
    const agentType = BOOK_TYPE_TO_AGENT_TYPE[bt.id as keyof typeof BOOK_TYPE_TO_AGENT_TYPE];
    const agent = agents?.find(a => a.type === agentType) || null;
    return { bookType: bt, agent };
  });

  // Save book type mutation
  const saveBookTypeMutation = useMutation({
    mutationFn: async (bookType: Partial<DatabaseBookType> & { id: string }) => {
      const { id, ...rest } = bookType;
      const { error } = await supabase
        .from('book_types')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
  });

  // Save agent mutation
  const saveAgentMutation = useMutation({
    mutationFn: async (agent: Partial<AgentData> & { id: string }) => {
      const { id, ...rest } = agent;
      const { error } = await supabase
        .from('agents')
        .update({ ...rest, last_modified: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
  });

  const handleSave = async (
    bookTypeData: Partial<DatabaseBookType> & { id: string },
    agentData: (Partial<AgentData> & { id: string }) | null
  ) => {
    try {
      // Save book type
      await saveBookTypeMutation.mutateAsync(bookTypeData);
      
      // Save agent if it exists
      if (agentData) {
        await saveAgentMutation.mutateAsync(agentData);
      }

      queryClient.invalidateQueries({ queryKey: ['book-types-admin'] });
      queryClient.invalidateQueries({ queryKey: ['book-types'] });
      queryClient.invalidateQueries({ queryKey: ['agents-book-creation'] });
      
      toast.success('Book agent configuration saved');
      setIsDialogOpen(false);
      setEditingPair(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    }
  };

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('book_types')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-types-admin'] });
      queryClient.invalidateQueries({ queryKey: ['book-types'] });
      toast.success('Status updated');
    },
  });

  const openEditDialog = (pair: BookAgentPair) => {
    setEditingPair(pair);
    setIsDialogOpen(true);
  };

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
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading book agents...
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Agents
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage book types and their linked AI agents in one place
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookAgentPairs.map((pair) => {
            const Icon = getIconComponent(pair.bookType.icon_name);
            
            return (
              <div
                key={pair.bookType.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                  "hover:bg-muted/50 cursor-pointer"
                )}
                onClick={() => openEditDialog(pair)}
              >
                {/* Icon & Book Type Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("p-2 rounded-lg bg-primary/10", pair.bookType.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{pair.bookType.label}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {pair.bookType.expected_page_count || 12} pages
                      </Badge>
                    </div>
                    
                    {/* Linked Agent */}
                    <div className="flex items-center gap-2 mt-1">
                      <Link2 className="h-3 w-3 text-muted-foreground" />
                      {pair.agent ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground truncate">
                            {pair.agent.name}
                          </span>
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            getStatusColor(pair.agent.operational_status)
                          )} />
                        </div>
                      ) : (
                        <span className="text-sm text-destructive">No agent linked</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={pair.bookType.is_active}
                    onCheckedChange={(checked) => {
                      toggleActiveMutation.mutate({ id: pair.bookType.id, is_active: checked });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditDialog(pair);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Two-Panel Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingPair && (
                <>
                  <BookOpen className="h-5 w-5" />
                  {editingPair.bookType.label}
                  <Link2 className="h-4 w-4 text-muted-foreground mx-2" />
                  <Bot className="h-5 w-5" />
                  {editingPair.agent?.name || 'No Agent'}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {editingPair && (
            <TwoPanelEditor
              pair={editingPair}
              onSave={handleSave}
              isSaving={saveBookTypeMutation.isPending || saveAgentMutation.isPending}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingPair(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TwoPanelEditorProps {
  pair: BookAgentPair;
  onSave: (
    bookType: Partial<DatabaseBookType> & { id: string },
    agent: (Partial<AgentData> & { id: string }) | null
  ) => void;
  isSaving: boolean;
  onCancel: () => void;
}

function TwoPanelEditor({ pair, onSave, isSaving, onCancel }: TwoPanelEditorProps) {
  // Book Type Form State
  const [bookTypeData, setBookTypeData] = useState({
    id: pair.bookType.id,
    label: pair.bookType.label,
    description: pair.bookType.description || '',
    prompt: pair.bookType.prompt || '',
    icon_name: pair.bookType.icon_name,
    color: pair.bookType.color || '',
    expected_page_count: pair.bookType.expected_page_count || 12,
    needs_clarification: pair.bookType.needs_clarification || false,
    clarification_context: pair.bookType.clarification_context || '',
    sort_order: pair.bookType.sort_order || 0,
  });

  // Agent Form State
  const [agentData, setAgentData] = useState(pair.agent ? {
    id: pair.agent.id,
    name: pair.agent.name,
    intent: pair.agent.intent,
    instructions: pair.agent.instructions,
  } : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(bookTypeData, agentData);
  };

  const iconNames = getAvailableIconNames();
  const SelectedIcon = getIconComponent(bookTypeData.icon_name);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Book Type Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 pb-2 border-b">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Book Type Settings</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bt-id">ID</Label>
              <Input
                id="bt-id"
                value={bookTypeData.id}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-label">Label</Label>
              <Input
                id="bt-label"
                value={bookTypeData.label}
                onChange={(e) => setBookTypeData({ ...bookTypeData, label: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bt-description">Description</Label>
            <Input
              id="bt-description"
              value={bookTypeData.description}
              onChange={(e) => setBookTypeData({ ...bookTypeData, description: e.target.value })}
              placeholder="Brief description for users"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={bookTypeData.icon_name}
                onValueChange={(v) => setBookTypeData({ ...bookTypeData, icon_name: v })}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <SelectedIcon className="h-4 w-4" />
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {iconNames.map((name) => {
                    const Icon = getIconComponent(name);
                    return (
                      <SelectItem key={name} value={name}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-color">Color</Label>
              <Input
                id="bt-color"
                value={bookTypeData.color}
                onChange={(e) => setBookTypeData({ ...bookTypeData, color: e.target.value })}
                placeholder="text-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-pages">Pages</Label>
              <Input
                id="bt-pages"
                type="number"
                value={bookTypeData.expected_page_count}
                onChange={(e) => setBookTypeData({ ...bookTypeData, expected_page_count: parseInt(e.target.value) || 12 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bt-sort">Sort Order</Label>
              <Input
                id="bt-sort"
                type="number"
                value={bookTypeData.sort_order}
                onChange={(e) => setBookTypeData({ ...bookTypeData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2 pt-7">
              <Switch
                id="bt-clarification"
                checked={bookTypeData.needs_clarification}
                onCheckedChange={(v) => setBookTypeData({ ...bookTypeData, needs_clarification: v })}
              />
              <Label htmlFor="bt-clarification">Needs Clarification</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bt-prompt">Initial Prompt</Label>
            <Textarea
              id="bt-prompt"
              value={bookTypeData.prompt}
              onChange={(e) => setBookTypeData({ ...bookTypeData, prompt: e.target.value })}
              placeholder="The prompt sent when this book type is selected"
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        {/* Right Panel: Agent Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Linked Agent Settings</h3>
          </div>

          {agentData ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={agentData.name}
                  onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-intent">Intent</Label>
                <Textarea
                  id="agent-intent"
                  value={agentData.intent}
                  onChange={(e) => setAgentData({ ...agentData, intent: e.target.value })}
                  placeholder="Describe the agent's purpose"
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="agent-instructions">System Prompt</Label>
                  <span className="text-xs text-muted-foreground">
                    {agentData.instructions?.length || 0} chars
                  </span>
                </div>
                <Textarea
                  id="agent-instructions"
                  value={agentData.instructions}
                  onChange={(e) => setAgentData({ ...agentData, instructions: e.target.value })}
                  placeholder="Full system prompt for this agent..."
                  rows={10}
                  className="text-xs font-mono"
                />
                {agentData.instructions && agentData.instructions.length < 500 && (
                  <p className="text-xs text-destructive">
                    ⚠️ Prompt is too short. Minimum 500 characters recommended.
                  </p>
                )}
              </div>

              {/* Agent Metadata (read-only) */}
              <div className="pt-2 border-t">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <span className="ml-1 font-mono">{pair.agent?.model}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tokens:</span>
                    <span className="ml-1">{pair.agent?.max_completion_tokens}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <span className="ml-1">{pair.agent?.version}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-1 capitalize">{pair.agent?.operational_status}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No agent linked to this book type
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The mapping is defined in BOOK_TYPE_TO_AGENT_TYPE
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save All'
          )}
        </Button>
      </div>
    </form>
  );
}
