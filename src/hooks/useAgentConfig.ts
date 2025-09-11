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
  const [lastChangeDescription, setLastChangeDescription] = useState<string | null>(null);
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

  const incrementVersion = useCallback((currentVersion: string): string => {
    const versionMatch = currentVersion.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (versionMatch) {
      const [, major, minor, patch] = versionMatch;
      return `v${major}.${minor}.${parseInt(patch) + 1}`;
    }
    return 'v1.0.1'; // fallback for invalid version format
  }, []);

  const clearChangeDescription = useCallback(() => {
    setLastChangeDescription(null);
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
          whatChanged: (data as any).what_changed || undefined,
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

  const saveConfigWithOverrides = useCallback(async (configOverrides?: Partial<AgentConfig>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use provided overrides or current config
      const configToSave = configOverrides ? { ...config, ...configOverrides } : config;

      // Check if agent exists to get original config for comparison
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let whatChanged = null;

      // Generate change description if agent exists and config has meaningful changes
      if (existingAgent) {
        try {
          // Convert existing agent to AgentConfig format for comparison
          const originalConfig: AgentConfig = {
            id: existingAgent.id,
            name: existingAgent.name,
            type: existingAgent.type as 'chat' | 'assistant',
            intent: existingAgent.intent,
            status: existingAgent.status as 'online' | 'offline' | 'processing',
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

          // Only call diff function if there are actual changes
          const hasChanges = 
            originalConfig.name !== configToSave.name ||
            originalConfig.type !== configToSave.type ||
            originalConfig.intent !== configToSave.intent ||
            originalConfig.status !== configToSave.status ||
            originalConfig.instructions !== configToSave.instructions ||
            originalConfig.modelSettings.model !== configToSave.modelSettings.model ||
            originalConfig.modelSettings.maxCompletionTokens !== configToSave.modelSettings.maxCompletionTokens ||
            originalConfig.modelSettings.topP !== configToSave.modelSettings.topP;

          if (hasChanges) {
            console.log('Generating change description...');
            const response = await supabase.functions.invoke('what_changed_in_agent', {
              body: {
                originalConfig,
                newConfig: configToSave,
              },
            });

            if (response.data?.whatChanged) {
              whatChanged = response.data.whatChanged;
              console.log('Generated change description:', whatChanged);
              // Set the change description for display and increment version
              setLastChangeDescription(whatChanged);
              const newVersion = incrementVersion(configToSave.version);
              configToSave.version = newVersion;
            }
          }
        } catch (error) {
          console.error('Failed to generate change description:', error);
          // Continue with save even if diff generation fails
        }
      }
      
      // Convert AgentConfig format to database format
      const dbData = {
        user_id: user.id,
        name: configToSave.name,
        type: configToSave.type,
        intent: configToSave.intent,
        status: configToSave.status,
        version: configToSave.version,
        last_modified: new Date().toISOString(),
        assistant_id: configToSave.assistantId || null,
        instructions: configToSave.instructions,
        model: configToSave.modelSettings.model,
        max_completion_tokens: configToSave.modelSettings.maxCompletionTokens,
        top_p: configToSave.modelSettings.topP,
        what_changed: whatChanged,
      };

      if (existingAgent) {
        // Update existing agent
        const { error } = await supabase
          .from('agents')
          .update(dbData)
          .eq('id', existingAgent.id);
        
        if (error) throw error;
      } else {
        // Create new agent (first time saving)
        const { error } = await supabase
          .from('agents')
          .insert({ ...dbData, what_changed: 'Agent created' });
        
        if (error) throw error;
      }
      
      // If overrides were provided, update the config state with them
      if (configOverrides) {
        setConfig(prev => ({ ...prev, ...configOverrides, lastModified: new Date() }));
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

  const saveConfig = useCallback(async () => {
    return saveConfigWithOverrides();
  }, [saveConfigWithOverrides]);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_AGENT_CONFIG);
    setHasUnsavedChanges(false);
  }, []);

  return {
    config,
    isLoading,
    isInitialLoading,
    hasUnsavedChanges,
    lastChangeDescription,
    updateConfig,
    updateModelSettings,
    saveConfig,
    saveConfigWithOverrides,
    resetConfig,
    loadAgentConfig,
    clearChangeDescription,
  };
};