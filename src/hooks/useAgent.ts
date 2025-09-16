import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AgentConfig } from '@/types/agent';
import { useEffect } from 'react';

/**
 * TanStack Query hook for fetching agent configuration
 */
export const useAgent = (agentType: AgentConfig['type']) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent', user?.id, agentType],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', agentType)
        .eq('is_latest', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // No agent found in database - return null
        return null;
      }

      // Convert database format to AgentConfig format
      return {
        id: data.id,
        name: data.name,
        type: data.type as AgentConfig['type'],
        intent: data.intent,
        status: data.operational_status as 'online' | 'offline' | 'processing',
        version: data.version,
        createdAt: new Date(data.created_at),
        lastModified: new Date(data.last_modified),
        assistantId: data.assistant_id || undefined,
        instructions: data.instructions,
        whatChanged: data.what_changed || undefined,
        versionNumber: data.version_number,
        isLatest: data.is_latest,
        parentAgentId: data.parent_agent_id || undefined,
        modelSettings: {
          model: data.model,
          maxCompletionTokens: data.max_completion_tokens,
          topP: data.top_p,
        },
      } as AgentConfig;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * TanStack Query mutations for agent operations
 */
export const useAgentMutations = (agentType: AgentConfig['type']) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const incrementVersion = (currentVersion: string): string => {
    const versionMatch = currentVersion.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (versionMatch) {
      const [, major, minor, patch] = versionMatch;
      return `v${major}.${minor}.${parseInt(patch) + 1}`;
    }
    return 'v1.0.1';
  };

  const saveMutation = useMutation({
    mutationFn: async ({ config, configOverrides }: { 
      config: AgentConfig; 
      configOverrides?: Partial<AgentConfig> 
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const configToSave = configOverrides ? { ...config, ...configOverrides } : config;

      // Check if agent exists
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', agentType)
        .eq('is_latest', true)
        .maybeSingle();

      let whatChanged = null;

      // Generate change description if agent exists and config has meaningful changes
      if (existingAgent) {
        const originalConfig: AgentConfig = {
          id: existingAgent.id,
          name: existingAgent.name,
          type: existingAgent.type as AgentConfig['type'],
          intent: existingAgent.intent,
          status: existingAgent.operational_status as 'online' | 'offline' | 'processing',
          version: existingAgent.version,
          createdAt: new Date(existingAgent.created_at),
          lastModified: new Date(existingAgent.last_modified),
          assistantId: existingAgent.assistant_id || undefined,
          instructions: existingAgent.instructions,
          modelSettings: {
            model: existingAgent.model,
            maxCompletionTokens: existingAgent.max_completion_tokens,
            topP: existingAgent.top_p,
          },
        };

        // Check for changes
        const hasChanges = 
          originalConfig.name !== configToSave.name ||
          originalConfig.intent !== configToSave.intent ||
          originalConfig.status !== configToSave.status ||
          originalConfig.instructions !== configToSave.instructions ||
          originalConfig.modelSettings.model !== configToSave.modelSettings.model ||
          originalConfig.modelSettings.maxCompletionTokens !== configToSave.modelSettings.maxCompletionTokens ||
          originalConfig.modelSettings.topP !== configToSave.modelSettings.topP;

        if (hasChanges) {
          try {
            const response = await supabase.functions.invoke('what_changed_in_agent', {
              body: { originalConfig, newConfig: configToSave },
            });

            if (response.data?.whatChanged) {
              whatChanged = response.data.whatChanged;
              configToSave.version = incrementVersion(configToSave.version);
            }
          } catch (error) {
            console.error('Failed to generate change description:', error);
          }
        }
      }

      const newVersionNumber = existingAgent ? (existingAgent.version_number || 1) + 1 : 1;
      const parentAgentId = existingAgent ? (existingAgent.parent_agent_id || existingAgent.id) : null;
      
      const dbData = {
        user_id: user.id,
        name: configToSave.name,
        type: configToSave.type,
        intent: configToSave.intent,
        operational_status: configToSave.status,
        version: configToSave.version,
        last_modified: new Date().toISOString(),
        assistant_id: configToSave.assistantId || null,
        instructions: configToSave.instructions,
        model: configToSave.modelSettings.model,
        max_completion_tokens: configToSave.modelSettings.maxCompletionTokens,
        top_p: configToSave.modelSettings.topP,
        what_changed: whatChanged || (existingAgent ? null : 'Agent created'),
        version_number: newVersionNumber,
        is_latest: true,
        parent_agent_id: parentAgentId,
      };

      const { data: newRecord, error } = await supabase
        .from('agents')
        .insert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      return { newRecord, whatChanged: whatChanged || (existingAgent ? null : 'Agent created') };
    },
    onSuccess: ({ newRecord, whatChanged }) => {
      // Optimistically update cache with complete new data
      const updatedConfig = {
        id: newRecord.id,
        name: newRecord.name,
        type: newRecord.type as AgentConfig['type'],
        intent: newRecord.intent,
        status: newRecord.operational_status as 'online' | 'offline' | 'processing',
        version: newRecord.version,
        createdAt: new Date(newRecord.created_at),
        lastModified: new Date(newRecord.last_modified),
        assistantId: newRecord.assistant_id || undefined,
        instructions: newRecord.instructions,
        whatChanged: newRecord.what_changed || undefined,
        versionNumber: newRecord.version_number,
        isLatest: newRecord.is_latest,
        parentAgentId: newRecord.parent_agent_id || undefined,
        modelSettings: {
          model: newRecord.model,
          maxCompletionTokens: newRecord.max_completion_tokens,
          topP: newRecord.top_p,
        },
      } as AgentConfig;
      
      queryClient.setQueryData(['agent', user?.id, agentType], updatedConfig);

      // Store change description
      if (whatChanged && user) {
        localStorage.setItem(`agent-last-change-${user.id}-${agentType}`, whatChanged);
      }

      toast({
        title: "Success",
        description: "Agent configuration saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving agent config:', error);
      toast({
        title: "Error",
        description: "Failed to save agent configuration",
        variant: "destructive",
      });
    },
  });

  return { saveMutation };
};

/**
 * Real-time subscription hook for agent updates
 */
export const useAgentRealtime = (agentType: AgentConfig['type']) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`agent-${agentType}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents',
          filter: `user_id=eq.${user.id} AND type=eq.${agentType}`
        },
        (payload) => {
          const data = payload.new as any;
          
          // Handle all events properly
          if (payload.eventType === 'DELETE') {
            // If an agent was deleted, invalidate cache
            queryClient.invalidateQueries({ queryKey: ['agent', user.id, agentType] });
            return;
          }
          
          if (data && data.is_latest) {
            const agentConfig: AgentConfig = {
              id: data.id,
              name: data.name,
              type: data.type as AgentConfig['type'],
              intent: data.intent,
              status: data.operational_status as 'online' | 'offline' | 'processing',
              version: data.version,
              createdAt: new Date(data.created_at),
              lastModified: new Date(data.last_modified),
              assistantId: data.assistant_id || undefined,
              instructions: data.instructions,
              whatChanged: data.what_changed || undefined,
              versionNumber: data.version_number,
              isLatest: data.is_latest,
              parentAgentId: data.parent_agent_id || undefined,
              modelSettings: {
                model: data.model,
                maxCompletionTokens: data.max_completion_tokens,
                topP: data.top_p,
              },
            };
            
            queryClient.setQueryData(['agent', user.id, agentType], agentConfig);
            
            // Update change description in localStorage for immediate UI updates
            if (data.what_changed) {
              localStorage.setItem(`agent-last-change-${user.id}-${agentType}`, data.what_changed);
              // Trigger a custom event to notify components
              window.dispatchEvent(new CustomEvent('agent-change-updated', { 
                detail: { agentType, whatChanged: data.what_changed } 
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, agentType, queryClient]);
};