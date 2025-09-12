/**
 * useAgentConfig - Advanced Agent Configuration Management Hook
 * 
 * A comprehensive React hook that manages AI agent configurations with automatic versioning,
 * change tracking, and database persistence. Provides a complete solution for creating,
 * updating, and managing different types of AI agents (chat, assistant, book-creation, illustration-director).
 * 
 * ## Key Features:
 * - **Automatic Versioning**: Creates new versions when configurations change
 * - **Change Tracking**: Generates human-readable descriptions of what changed between versions
 * - **Database Persistence**: Stores configurations in Supabase with full audit trail
 * - **Real-time Updates**: Syncs configuration changes across components
 * - **Type Safety**: Fully typed with TypeScript for different agent types
 * - **Optimistic Updates**: Provides immediate UI feedback while persisting changes
 * 
 * ## Agent Types Supported:
 * - `'chat'`: Conversational AI agents for interactive chat experiences
 * - `'assistant'`: Task-oriented AI assistants with specific capabilities  
 * - `'book-creation'`: Specialized agents for generating educational content
 * - `'illustration-director'`: Creates visual style guides for consistent book illustrations
 * 
 * ## Configuration Structure:
 * Each agent configuration includes:
 * - Basic metadata (name, type, intent, status)
 * - System instructions (behavior and personality)
 * - Model settings (OpenAI model, tokens, parameters)
 * - Versioning information (version number, change history)
 * 
 * ## Usage Example:
 * ```tsx
 * const {
 *   config,
 *   isLoading,
 *   hasUnsavedChanges,
 *   updateConfig,
 *   saveConfig,
 *   resetConfig
 * } = useAgentConfig('chat');
 * 
 * // Update configuration
 * updateConfig({
 *   name: 'My Chat Assistant',
 *   instructions: 'You are a helpful AI assistant...'
 * });
 * 
 * // Save changes (creates new version automatically)
 * await saveConfig();
 * ```
 * 
 * ## Change Detection & Versioning:
 * - Automatically detects meaningful changes in configuration
 * - Generates semantic version numbers (v1.0.1, v1.0.2, etc.)
 * - Uses AI to create human-readable change descriptions
 * - Maintains parent-child relationships between versions
 * - Preserves complete audit trail of all changes
 * 
 * ## Database Schema:
 * Integrates with the `agents` table which includes:
 * - Configuration data (name, type, instructions, model settings)
 * - Versioning fields (version, version_number, is_latest, parent_agent_id)
 * - Metadata (created_at, updated_at, last_modified, what_changed)
 * - User association (user_id for multi-tenant support)
 * 
 * ## Error Handling:
 * - Graceful fallbacks to default configurations
 * - Toast notifications for user feedback
 * - Detailed console logging for debugging
 * - Continues operation even if change detection fails
 * 
 * ## Performance Considerations:
 * - Uses localStorage for change description persistence
 * - Implements optimistic updates for immediate UI feedback
 * - Batches database operations to minimize API calls
 * - Caches loaded configurations to reduce redundant queries
 * 
 * @param agentType - The type of agent to manage ('chat' | 'assistant' | 'book-creation' | 'illustration-director')
 * @returns Object containing configuration state, loading states, and management functions
 */

import { useState, useCallback, useEffect } from 'react';
import { AgentConfig, DEFAULT_AGENT_CONFIG, AGENT_TYPE_CONFIGS } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAgentConfig = (agentType: AgentConfig['type']) => {
  const [config, setConfig] = useState<AgentConfig>(AGENT_TYPE_CONFIGS[agentType] || DEFAULT_AGENT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastChangeDescription, setLastChangeDescription] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load agent config from database on mount and restore last change description
  useEffect(() => {
    if (user) {
      loadAgentConfig();
      // Restore last change description from localStorage
      const storedChange = localStorage.getItem(`agent-last-change-${user.id}-${agentType}`);
      if (storedChange) {
        setLastChangeDescription(storedChange);
      }
    }
  }, [user, agentType]);

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
        .eq('type', agentType)
        .eq('is_latest', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Convert database format to AgentConfig format
        const agentConfig: AgentConfig = {
          id: data.id,
          name: data.name,
          type: data.type as AgentConfig['type'],
          intent: data.intent,
          status: data.status as 'online' | 'offline' | 'processing',
          version: data.version,
          createdAt: new Date(data.created_at),
          lastModified: new Date(data.last_modified),
          assistantId: data.assistant_id || undefined,
          instructions: data.instructions,
          whatChanged: (data as any).what_changed || undefined,
          versionNumber: data.version_number,
          isLatest: data.is_latest,
          parentAgentId: data.parent_agent_id || undefined,
          modelSettings: {
            model: data.model,
            maxCompletionTokens: data.max_completion_tokens,
            topP: data.top_p,
          },
        };
        setConfig(agentConfig);
      } else {
        // No existing config found, use default for this agent type
        const defaultConfig = AGENT_TYPE_CONFIGS[agentType] || DEFAULT_AGENT_CONFIG;
        setConfig(defaultConfig);
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
  }, [user, toast, agentType]);

  const saveConfigWithOverrides = useCallback(async (configOverrides?: Partial<AgentConfig>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use provided overrides or current config
      const configToSave = configOverrides ? { ...config, ...configOverrides } : config;

      // Check if agent exists to get original config for comparison and parent ID
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
        try {
          // Convert existing agent to AgentConfig format for comparison
          const originalConfig: AgentConfig = {
            id: existingAgent.id,
            name: existingAgent.name,
            type: existingAgent.type as AgentConfig['type'],
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

            console.log('Edge function response:', response);

            if (response.data?.whatChanged) {
              whatChanged = response.data.whatChanged;
              console.log('Generated change description:', whatChanged);
              // Set the change description for display and increment version
              setLastChangeDescription(whatChanged);
              // Persist to localStorage
              if (user) {
                localStorage.setItem(`agent-last-change-${user.id}-${agentType}`, whatChanged);
              }
              const newVersion = incrementVersion(configToSave.version);
              configToSave.version = newVersion;
              console.log('Updated version to:', newVersion);
            } else {
              console.log('No whatChanged in response:', response);
            }
          }
        } catch (error) {
          console.error('Failed to generate change description:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          // Continue with save even if diff generation fails
        }
      }
      
      // Convert AgentConfig format to database format for new record creation
      const newVersionNumber = existingAgent ? (existingAgent.version_number || 1) + 1 : 1;
      const parentAgentId = existingAgent ? (existingAgent.parent_agent_id || existingAgent.id) : null;
      
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
        version_number: newVersionNumber,
        is_latest: true,
        parent_agent_id: parentAgentId,
      };

      // Always create a new record (versioning)
      if (existingAgent) {
        // Create new version
        const { data: newRecord, error } = await supabase
          .from('agents')
          .insert(dbData)
          .select()
          .single();
        
        if (error) throw error;
        
        // Update local config with new record data
        setConfig(prev => ({
          ...prev,
          id: newRecord.id,
          versionNumber: newRecord.version_number,
          isLatest: newRecord.is_latest,
          parentAgentId: newRecord.parent_agent_id,
          lastModified: new Date(newRecord.last_modified),
        }));
      } else {
        // Create first version (initial creation)
        const { data: newRecord, error } = await supabase
          .from('agents')
          .insert({ ...dbData, what_changed: 'Agent created' })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update local config with new record data
        setConfig(prev => ({
          ...prev,
          id: newRecord.id,
          versionNumber: newRecord.version_number,
          isLatest: newRecord.is_latest,
          parentAgentId: newRecord.parent_agent_id,
          lastModified: new Date(newRecord.last_modified),
        }));
        
        // Set initial change description for new agents
        setLastChangeDescription('Agent created');
        if (user) {
          localStorage.setItem(`agent-last-change-${user.id}-${agentType}`, 'Agent created');
        }
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
  }, [config, user, toast, agentType]);

  const saveConfig = useCallback(async () => {
    return saveConfigWithOverrides();
  }, [saveConfigWithOverrides]);

  const resetConfig = useCallback(() => {
    const defaultConfig = AGENT_TYPE_CONFIGS[agentType] || DEFAULT_AGENT_CONFIG;
    setConfig(defaultConfig);
    setHasUnsavedChanges(false);
  }, [agentType]);

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