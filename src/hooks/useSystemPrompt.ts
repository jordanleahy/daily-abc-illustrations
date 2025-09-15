import { useState } from 'react';
import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the structure of a system prompt
export interface SystemPrompt {
  id: string;
  content: string;
  versionNumber: number;
  isDeployed: boolean;
  lastModified: string;
  deployedAt?: string;
  sourceType: 'generated' | 'manual';
  generationMetadata?: any;
  promptStatus?: string;
}

export interface SystemPromptVersion {
  id: string;
  content: string;
  versionNumber: number;
  createdAt: string;
  isDeployed: boolean;
  deployedAt?: string;
  sourceType: 'generated' | 'manual';
  generationMetadata?: any;
  promptStatus?: string;
}

export const useSystemPrompt = (bookId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Fetch current prompt (latest version)
  const { data: currentPrompt = null, refetch: refetchCurrent } = useQuery({
    queryKey: ['book-system-prompt-current', bookId],
    queryFn: async (): Promise<SystemPrompt | null> => {
      if (!bookId) return null;
      
      console.log(`[useSystemPrompt] Fetching current prompt for book ${bookId}`);
      
      const { data: currentData, error: currentError } = await supabase
        .from('book_system_prompts')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .maybeSingle();

      if (currentError) {
        console.error('Error fetching current prompt:', currentError);
        throw currentError;
      }

      if (!currentData) {
        console.log(`[useSystemPrompt] No current prompt found for book ${bookId}`);
        return null;
      }
      
      console.log(`[useSystemPrompt] Found current prompt:`, currentData);

      return {
        id: currentData.id,
        content: currentData.content,
        versionNumber: currentData.version_number,
        isDeployed: currentData.is_deployed,
        lastModified: currentData.updated_at,
        deployedAt: currentData.deployed_at || undefined,
        sourceType: currentData.source_type as 'generated' | 'manual',
        generationMetadata: currentData.generation_metadata,
        promptStatus: currentData.prompt_status
      };
    },
    enabled: !!bookId,
    refetchInterval: 5000, // Poll every 5 seconds as fallback
    refetchIntervalInBackground: false,
  });

  // Fetch all versions
  const { data: versions = [], isLoading, refetch: refetchVersions } = useQuery({
    queryKey: ['book-system-prompt-versions', bookId],
    queryFn: async (): Promise<SystemPromptVersion[]> => {
      if (!bookId) return [];
      
      console.log(`[useSystemPrompt] Fetching versions for book ${bookId}`);
      
      const { data: versionsData, error: versionsError } = await supabase
        .from('book_system_prompts')
        .select('*')
        .eq('book_id', bookId)
        .order('version_number', { ascending: false });

      if (versionsError) {
        console.error('Error fetching versions:', versionsError);
        throw versionsError;
      }

      console.log(`[useSystemPrompt] Found ${versionsData.length} versions for book ${bookId}`);

      return versionsData.map(v => ({
        id: v.id,
        content: v.content,
        versionNumber: v.version_number,
        createdAt: v.created_at,
        isDeployed: v.is_deployed,
        deployedAt: v.deployed_at || undefined,
        sourceType: v.source_type as 'generated' | 'manual',
        generationMetadata: v.generation_metadata,
        promptStatus: v.prompt_status
      }));
    },
    enabled: !!bookId,
    refetchInterval: 5000, // Poll every 5 seconds as fallback
    refetchIntervalInBackground: false,
  });

  // Save edit mutation
  const saveEditMutation = useMutation({
    mutationFn: async (editedContent: string) => {
      if (!editedContent.trim()) throw new Error('Content cannot be empty');
      
      // Get next version number
      const { data: nextVersionData } = await supabase.rpc('get_next_version_number', {
        p_book_id: bookId
      });
      
      const nextVersion = nextVersionData || 1;
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create new version
      const { data: newPrompt, error } = await supabase
        .from('book_system_prompts')
        .insert({
          book_id: bookId,
          user_id: user.id,
          content: editedContent,
          version_number: nextVersion,
          source_type: 'manual',
          is_latest: true,
          is_deployed: false
        })
        .select()
        .single();

      if (error) throw error;
      return newPrompt;
    },
    onSuccess: (newPrompt) => {
      const updatedPrompt: SystemPrompt = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.version_number,
        isDeployed: newPrompt.is_deployed,
        lastModified: newPrompt.updated_at,
        sourceType: newPrompt.source_type as 'generated' | 'manual',
        generationMetadata: newPrompt.generation_metadata,
        promptStatus: newPrompt.prompt_status
      };

      const newVersion: SystemPromptVersion = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.version_number,
        createdAt: newPrompt.created_at,
        isDeployed: newPrompt.is_deployed,
        sourceType: newPrompt.source_type as 'generated' | 'manual',
        generationMetadata: newPrompt.generation_metadata,
        promptStatus: newPrompt.prompt_status
      };

      queryClient.setQueryData(['book-system-prompt-current', bookId], updatedPrompt);
      queryClient.setQueryData(['book-system-prompt-versions', bookId], (old: SystemPromptVersion[] = []) => 
        [newVersion, ...old]
      );
      
      toast({
        title: "Success",
        description: "System prompt saved successfully"
      });
    },
    onError: (error: any) => {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save system prompt",
        variant: "destructive"
      });
    }
  });

  // Deploy version mutation
  const deployVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from('book_system_prompts')
        .update({ is_deployed: true })
        .eq('id', versionId);

      if (error) throw error;

      // Fetch updated prompt
      const { data: updatedPrompt } = await supabase
        .from('book_system_prompts')
        .select('*')
        .eq('id', versionId)
        .single();

      return updatedPrompt;
    },
    onSuccess: (updatedPrompt) => {
      const newCurrentPrompt: SystemPrompt = {
        id: updatedPrompt.id,
        content: updatedPrompt.content,
        versionNumber: updatedPrompt.version_number,
        isDeployed: updatedPrompt.is_deployed,
        lastModified: updatedPrompt.updated_at,
        deployedAt: updatedPrompt.deployed_at || undefined,
        sourceType: updatedPrompt.source_type as 'generated' | 'manual',
        generationMetadata: updatedPrompt.generation_metadata,
        promptStatus: updatedPrompt.prompt_status
      };

      queryClient.setQueryData(['book-system-prompt-current', bookId], newCurrentPrompt);
      queryClient.setQueryData(['book-system-prompt-versions', bookId], (old: SystemPromptVersion[] = []) =>
        old.map(v => ({
          ...v,
          isDeployed: v.id === updatedPrompt.id,
          deployedAt: v.id === updatedPrompt.id ? updatedPrompt.deployed_at : v.deployedAt
        }))
      );

      toast({
        title: "Success",
        description: "Version deployed successfully"
      });
    },
    onError: (error: any) => {
      console.error('Error deploying version:', error);
      toast({
        title: "Error",
        description: "Failed to deploy version",
        variant: "destructive"
      });
    }
  });

  // Revert to version mutation
  const revertToVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const versionToRevert = versions.find(v => v.id === versionId);
      if (!versionToRevert) {
        throw new Error('Version not found');
      }

      // Get next version number
      const { data: nextVersionData } = await supabase.rpc('get_next_version_number', {
        p_book_id: bookId
      });
      
      const nextVersion = nextVersionData || 1;

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create new version based on the reverted version
      const { data: newPrompt, error } = await supabase
        .from('book_system_prompts')
        .insert({
          book_id: bookId,
          user_id: user.id,
          content: versionToRevert.content,
          version_number: nextVersion,
          source_type: 'manual',
          is_latest: true,
          is_deployed: false
        })
        .select()
        .single();

      if (error) throw error;
      return { newPrompt, versionToRevert };
    },
    onSuccess: ({ newPrompt, versionToRevert }) => {
      const updatedPrompt: SystemPrompt = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.version_number,
        isDeployed: newPrompt.is_deployed,
        lastModified: newPrompt.updated_at,
        sourceType: newPrompt.source_type as 'generated' | 'manual',
        generationMetadata: newPrompt.generation_metadata,
        promptStatus: newPrompt.prompt_status
      };

      const newVersion: SystemPromptVersion = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.version_number,
        createdAt: newPrompt.created_at,
        isDeployed: newPrompt.is_deployed,
        sourceType: newPrompt.source_type as 'generated' | 'manual',
        generationMetadata: newPrompt.generation_metadata,
        promptStatus: newPrompt.prompt_status
      };

      queryClient.setQueryData(['book-system-prompt-current', bookId], updatedPrompt);
      queryClient.setQueryData(['book-system-prompt-versions', bookId], (old: SystemPromptVersion[] = []) => 
        [newVersion, ...old]
      );
      
      toast({
        title: "Success",
        description: `Reverted to version ${versionToRevert.versionNumber}`
      });
    },
    onError: (error: any) => {
      console.error('Error reverting version:', error);
      toast({
        title: "Error",
        description: "Failed to revert to version",
        variant: "destructive"
      });
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!bookId) return;
    
    // Set up real-time subscription for book system prompts
    const channel = supabase
      .channel('book-system-prompts-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'book_system_prompts',
          filter: `book_id=eq.${bookId}`
        },
        (payload) => {
          console.log(`[useSystemPrompt] Real-time update received for book ${bookId}:`, payload);
          
          if (payload.eventType === 'INSERT') {
            const newPrompt = payload.new as any;
            const newVersion: SystemPromptVersion = {
              id: newPrompt.id,
              content: newPrompt.content,
              versionNumber: newPrompt.version_number,
              createdAt: newPrompt.created_at,
              isDeployed: newPrompt.is_deployed,
              deployedAt: newPrompt.deployed_at || undefined,
              sourceType: newPrompt.source_type as 'generated' | 'manual',
              generationMetadata: newPrompt.generation_metadata,
              promptStatus: newPrompt.prompt_status
            };
            
            queryClient.setQueryData(['book-system-prompt-versions', bookId], (old: SystemPromptVersion[] = []) =>
              [newVersion, ...old]
            );
            
            // If this is the latest version, update current prompt
            if (newPrompt.is_latest) {
              const newCurrentPrompt: SystemPrompt = {
                id: newPrompt.id,
                content: newPrompt.content,
                versionNumber: newPrompt.version_number,
                isDeployed: newPrompt.is_deployed,
                lastModified: newPrompt.updated_at,
                deployedAt: newPrompt.deployed_at || undefined,
                sourceType: newPrompt.source_type as 'generated' | 'manual',
                generationMetadata: newPrompt.generation_metadata,
                promptStatus: newPrompt.prompt_status
              };
              console.log(`[useSystemPrompt] Setting new current prompt via real-time:`, newCurrentPrompt);
              queryClient.setQueryData(['book-system-prompt-current', bookId], newCurrentPrompt);
              
              // Force refetch to ensure data consistency
              setTimeout(() => {
                refetchCurrent();
              }, 1000);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedPrompt = payload.new as any;
            const updatedVersion: SystemPromptVersion = {
              id: updatedPrompt.id,
              content: updatedPrompt.content,
              versionNumber: updatedPrompt.version_number,
              createdAt: updatedPrompt.created_at,
              isDeployed: updatedPrompt.is_deployed,
              deployedAt: updatedPrompt.deployed_at || undefined,
              sourceType: updatedPrompt.source_type as 'generated' | 'manual',
              generationMetadata: updatedPrompt.generation_metadata,
              promptStatus: updatedPrompt.prompt_status
            };
            
            queryClient.setQueryData(['book-system-prompt-versions', bookId], (old: SystemPromptVersion[] = []) =>
              old.map(version => 
                version.id === updatedPrompt.id ? updatedVersion : version
              )
            );
            
            // Update current prompt if this is the latest or deployed version
            if (updatedPrompt.is_latest || updatedPrompt.is_deployed) {
              const updatedCurrentPrompt: SystemPrompt = {
                id: updatedPrompt.id,
                content: updatedPrompt.content,
                versionNumber: updatedPrompt.version_number,
                isDeployed: updatedPrompt.is_deployed,
                lastModified: updatedPrompt.updated_at,
                deployedAt: updatedPrompt.deployed_at || undefined,
                sourceType: updatedPrompt.source_type as 'generated' | 'manual',
                generationMetadata: updatedPrompt.generation_metadata,
                promptStatus: updatedPrompt.prompt_status
              };
              queryClient.setQueryData(['book-system-prompt-current', bookId], updatedCurrentPrompt);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            queryClient.setQueryData(['book-system-prompt-versions', bookId], (old: SystemPromptVersion[] = []) =>
              old.filter(version => version.id !== deletedId)
            );
            
            // If the deleted prompt was the current one, clear it
            queryClient.setQueryData(['book-system-prompt-current', bookId], (old: SystemPrompt | null) =>
              old?.id === deletedId ? null : old
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or bookId change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookId, queryClient]);

  const refreshData = async () => {
    console.log(`[useSystemPrompt] Manual refresh triggered for book ${bookId}`);
    // Force refetch both queries
    await Promise.all([
      refetchCurrent(),
      refetchVersions()
    ]);
    // Also invalidate to ensure cache is fresh
    queryClient.invalidateQueries({ queryKey: ['book-system-prompt-current', bookId] });
    queryClient.invalidateQueries({ queryKey: ['book-system-prompt-versions', bookId] });
  };

  const startEdit = () => {
    setIsEditing(true);
    setEditedContent(currentPrompt?.content || '');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const updateEditedContent = (content: string) => {
    setEditedContent(content);
  };

  const handleSaveEdit = () => {
    if (!editedContent.trim()) return;
    saveEditMutation.mutateAsync(editedContent).then(() => {
      setIsEditing(false);
      setEditedContent('');
    });
  };

  return {
    currentPrompt,
    versions,
    isLoading,
    isEditing,
    editedContent,
    startEdit,
    cancelEdit,
    saveEdit: handleSaveEdit,
    deployVersion: deployVersionMutation.mutateAsync,
    revertToVersion: revertToVersionMutation.mutateAsync,
    updateEditedContent,
    refreshData,
  };
};