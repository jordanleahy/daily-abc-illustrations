import { useState, useCallback, useEffect } from 'react';
import { AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAgentConfig = () => {
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load agent config from database on mount
  useEffect(() => {
    if (user) {
      loadAgentConfig();
    }
  }, [user]);

  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates,
      lastModified: new Date(),
    }));
    setHasUnsavedChanges(true);
  }, []);

  const updateModelSettings = useCallback((settings: Partial<AgentConfig['modelSettings']>) => {
    updateConfig({
      modelSettings: {
        ...config.modelSettings,
        ...settings,
      },
    });
  }, [config.modelSettings, updateConfig]);

  const loadAgentConfig = useCallback(async () => {
    if (!user) return;
    
    setIsInitialLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Convert database format to AgentConfig format
        const agentConfig: AgentConfig = {
          id: data.id,
          name: data.name,
          type: data.type as 'chat' | 'assistant',
          intent: data.intent,
          status: data.status as 'online' | 'offline' | 'processing',
          version: data.version,
          createdAt: new Date(data.created_at),
          lastModified: new Date(data.last_modified),
          assistantId: data.assistant_id || undefined,
          instructions: data.instructions,
          modelSettings: {
            model: data.model,
            maxCompletionTokens: data.max_completion_tokens,
            topP: data.top_p,
          },
        };
        setConfig(agentConfig);
      }
    } catch (error) {
      console.error('Error loading agent config:', error);
      toast({
        title: "Error",
        description: "Failed to load agent configuration",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  }, [user, toast]);

  const saveConfig = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Convert AgentConfig format to database format
      const dbData = {
        user_id: user.id,
        name: config.name,
        type: config.type,
        intent: config.intent,
        status: config.status,
        version: config.version,
        last_modified: new Date().toISOString(),
        assistant_id: config.assistantId || null,
        instructions: config.instructions,
        model: config.modelSettings.model,
        max_completion_tokens: config.modelSettings.maxCompletionTokens,
        top_p: config.modelSettings.topP,
      };

      // Check if agent exists
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingAgent) {
        // Update existing agent
        const { error } = await supabase
          .from('agents')
          .update(dbData)
          .eq('id', existingAgent.id);
        
        if (error) throw error;
      } else {
        // Create new agent
        const { error } = await supabase
          .from('agents')
          .insert(dbData);
        
        if (error) throw error;
      }
      
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Agent configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving agent config:', error);
      toast({
        title: "Error",
        description: "Failed to save agent configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [config, user, toast]);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_AGENT_CONFIG);
    setHasUnsavedChanges(false);
  }, []);

  return {
    config,
    isLoading,
    isInitialLoading,
    hasUnsavedChanges,
    updateConfig,
    updateModelSettings,
    saveConfig,
    resetConfig,
    loadAgentConfig,
  };
};