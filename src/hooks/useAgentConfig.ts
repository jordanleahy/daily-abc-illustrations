import { useState, useCallback, useEffect } from 'react';
import { AgentConfig } from '@/types/agent';
import { useAgent, useAgentMutations, useAgentRealtime } from '@/hooks/useAgent';
import { useAuth } from '@/hooks/useAuth';

/**
 * Optimized agent configuration hook using TanStack Query
 * Combines data fetching, mutations, and local editing state
 */
export const useAgentConfig = (agentType: AgentConfig['type']) => {
  const { user } = useAuth();
  const { data: config, isLoading: isInitialLoading, error } = useAgent(agentType);
  const { saveMutation } = useAgentMutations(agentType);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastChangeDescription, setLastChangeDescription] = useState<string | null>(null);
  const [localConfig, setLocalConfig] = useState<Partial<AgentConfig>>({});

  // Set up real-time updates
  useAgentRealtime(agentType);

  // Get last change description from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem(`agent-last-change-${user.id}-${agentType}`);
      if (stored) {
        setLastChangeDescription(stored);
      }
    }
  }, [user?.id, agentType]);

  const updateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  const updateModelSettings = useCallback((settings: Partial<AgentConfig['modelSettings']>) => {
    updateConfig({
      modelSettings: {
        ...config?.modelSettings,
        ...localConfig.modelSettings,
        ...settings,
      },
    });
  }, [config?.modelSettings, localConfig.modelSettings, updateConfig]);

  const saveConfig = useCallback(async () => {
    if (!config) return;
    
    const finalConfig = { ...config, ...localConfig, lastModified: new Date() };
    await saveMutation.mutateAsync({ config: finalConfig });
    setHasUnsavedChanges(false);
    setLocalConfig({});
  }, [config, localConfig, saveMutation]);

  const saveConfigWithOverrides = useCallback(async (configOverrides?: Partial<AgentConfig>) => {
    if (!config) return;
    
    const finalConfig = { ...config, ...localConfig, lastModified: new Date() };
    await saveMutation.mutateAsync({ config: finalConfig, configOverrides });
    setHasUnsavedChanges(false);
    setLocalConfig({});
  }, [config, localConfig, saveMutation]);

  const resetConfig = useCallback(() => {
    setLocalConfig({});
    setHasUnsavedChanges(false);
  }, []);

  // Listen for change description updates from real-time
  useEffect(() => {
    const handleChangeUpdate = (event: any) => {
      if (event.detail.agentType === agentType) {
        setLastChangeDescription(event.detail.whatChanged);
      }
    };

    window.addEventListener('agent-change-updated', handleChangeUpdate);
    return () => window.removeEventListener('agent-change-updated', handleChangeUpdate);
  }, [agentType]);

  // Clear local changes when config changes (new version from server)
  useEffect(() => {
    if (config && hasUnsavedChanges) {
      setLocalConfig({});
      setHasUnsavedChanges(false);
    }
  }, [config?.version]); // Only reset when version changes

  const clearChangeDescription = useCallback(() => {
    setLastChangeDescription(null);
    if (user?.id) {
      localStorage.removeItem(`agent-last-change-${user.id}-${agentType}`);
    }
  }, [user?.id, agentType]);

  // Merge server config with local changes
  const finalConfig = config ? { ...config, ...localConfig } : undefined;

  return {
    config: finalConfig,
    isLoading: saveMutation.isPending,
    isInitialLoading,
    hasUnsavedChanges,
    lastChangeDescription,
    updateConfig,
    updateModelSettings,
    saveConfig,
    saveConfigWithOverrides,
    resetConfig,
    clearChangeDescription,
    error,
  };
};