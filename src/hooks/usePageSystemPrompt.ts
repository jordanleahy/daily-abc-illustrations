import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageSystemPrompt, PageSystemPromptVersion } from '@/types/pageSystemPrompt';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

/**
 * TanStack Query hook for page system prompts with real-time updates
 */
export function usePageSystemPrompt(pageId: string) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current prompt
  const { data: currentPrompt, isLoading } = useQuery({
    queryKey: ['pageSystemPrompt', pageId],
    queryFn: async () => {
      if (!pageId) return null;

      const { data, error } = await supabase
        .from('page_system_prompts')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_latest', true)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as PageSystemPrompt | null;
    },
    enabled: !!pageId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch all versions
  const { data: versions = [] } = useQuery({
    queryKey: ['pageSystemPromptVersions', pageId],
    queryFn: async () => {
      if (!pageId) return [];

      const { data, error } = await supabase
        .from('page_system_prompts')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PageSystemPromptVersion[];
    },
    enabled: !!pageId,
    staleTime: 2 * 60 * 1000,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!pageId || !content.trim()) throw new Error('Invalid content');

      // Get page and book info
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('book_id, books!inner(user_id)')
        .eq('id', pageId)
        .single();

      if (pageError) throw pageError;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get next version number
      const { data: versionData, error: versionError } = await supabase
        .rpc('get_next_page_prompt_version_number', { p_page_id: pageId });

      if (versionError) throw versionError;

      // Create new version
      const { data, error: insertError } = await supabase
        .from('page_system_prompts')
        .insert({
          page_id: pageId,
          book_id: pageData.book_id,
          user_id: user.id,
          content: content.trim(),
          version_number: versionData,
          is_latest: true,
          source_type: 'manual',
          prompt_status: 'complete'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageSystemPrompt', pageId] });
      queryClient.invalidateQueries({ queryKey: ['pageSystemPromptVersions', pageId] });
      setIsEditing(false);
      setEditedContent('');
      toast({
        title: "Success",
        description: "Page system prompt saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error saving page system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save page system prompt",
        variant: "destructive",
      });
    },
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from('page_system_prompts')
        .update({ is_deployed: true })
        .eq('id', versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageSystemPrompt', pageId] });
      queryClient.invalidateQueries({ queryKey: ['pageSystemPromptVersions', pageId] });
      toast({
        title: "Success",
        description: "Page system prompt deployed successfully",
      });
    },
    onError: (error) => {
      console.error('Error deploying page system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to deploy page system prompt version",
        variant: "destructive",
      });
    },
  });

  // Revert mutation
  const revertMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const versionToRevert = versions.find(v => v.id === versionId);
      if (!versionToRevert) throw new Error('Version not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get next version number
      const { data: versionData, error: versionError } = await supabase
        .rpc('get_next_page_prompt_version_number', { p_page_id: pageId });

      if (versionError) throw versionError;

      // Create new version based on reverted version
      const { data, error: insertError } = await supabase
        .from('page_system_prompts')
        .insert({
          page_id: pageId,
          book_id: versionToRevert.book_id,
          user_id: user.id,
          content: versionToRevert.content,
          version_number: versionData,
          is_latest: true,
          source_type: 'manual',
          prompt_status: 'complete',
          generation_metadata: {
            ...versionToRevert.generation_metadata,
            reverted_from_version: versionToRevert.version_number
          }
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return { data, versionNumber: versionToRevert.version_number };
    },
    onSuccess: ({ versionNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['pageSystemPrompt', pageId] });
      queryClient.invalidateQueries({ queryKey: ['pageSystemPromptVersions', pageId] });
      toast({
        title: "Success",
        description: `Reverted to version ${versionNumber}`,
      });
    },
    onError: (error) => {
      console.error('Error reverting page system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to revert to selected version",
        variant: "destructive",
      });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!pageId) return;

    const channel = supabase
      .channel(`page_system_prompts:${pageId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'page_system_prompts',
          filter: `page_id=eq.${pageId}`
        },
        () => {
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['pageSystemPrompt', pageId] });
          queryClient.invalidateQueries({ queryKey: ['pageSystemPromptVersions', pageId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, queryClient]);

  // Helper functions
  const startEdit = useCallback(() => {
    setIsEditing(true);
    setEditedContent(currentPrompt?.content || '');
  }, [currentPrompt]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedContent('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editedContent.trim()) return;
    await saveMutation.mutateAsync(editedContent);
  }, [editedContent, saveMutation]);

  const deployVersion = useCallback(async (versionId: string) => {
    await deployMutation.mutateAsync(versionId);
  }, [deployMutation]);

  const revertToVersion = useCallback(async (versionId: string) => {
    await revertMutation.mutateAsync(versionId);
  }, [revertMutation]);

  const updateEditedContent = useCallback((content: string) => {
    setEditedContent(content);
  }, []);

  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pageSystemPrompt', pageId] });
    queryClient.invalidateQueries({ queryKey: ['pageSystemPromptVersions', pageId] });
  }, [queryClient, pageId]);

  return {
    currentPrompt,
    versions,
    isLoading,
    isEditing,
    editedContent,
    startEdit,
    cancelEdit,
    saveEdit,
    deployVersion,
    revertToVersion,
    updateEditedContent,
    refreshData,
  };
}