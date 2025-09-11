import { useState, useCallback } from 'react';
import { AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';

export const useAgentConfig = () => {
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

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

  const saveConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual Supabase integration later
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasUnsavedChanges(false);
      toast({
        title: "Success",
        description: "Agent configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save agent configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_AGENT_CONFIG);
    setHasUnsavedChanges(false);
  }, []);

  return {
    config,
    isLoading,
    hasUnsavedChanges,
    updateConfig,
    updateModelSettings,
    saveConfig,
    resetConfig,
  };
};