import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PageSimplifiedPrompt, PageSimplifiedPromptVersion } from '@/types/pageSimplifiedPrompt';
import { useState, useEffect } from 'react';

export function usePageSimplifiedPrompt(pageId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Fetch current simplified prompt
  const { data: currentPrompt, isLoading } = useQuery({
    queryKey: ['page-simplified-prompt', pageId],
    queryFn: async (): Promise<PageSimplifiedPrompt | null> => {
      const { data, error } = await supabase
        .from('page_simplified_prompts')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_latest', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching simplified prompt:', error);
        throw error;
      }

      return data as PageSimplifiedPrompt | null;
    },
  });

  // Fetch all versions
  const { data: versions = [] } = useQuery({
    queryKey: ['page-simplified-prompt-versions', pageId],
    queryFn: async (): Promise<PageSimplifiedPromptVersion[]> => {
      const { data, error } = await supabase
        .from('page_simplified_prompts')
        .select('*')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching simplified prompt versions:', error);
        throw error;
      }

      return (data || []) as PageSimplifiedPromptVersion[];
    },
  });

  // Generate simplified prompt mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('simplify-image-prompt', {
        body: { pageId, userId: user.id }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate simplified prompt');
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Image prompt simplified successfully",
      });
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['page-simplified-prompt', pageId] });
      queryClient.invalidateQueries({ queryKey: ['page-simplified-prompt-versions', pageId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate simplified prompt",
        variant: "destructive",
      });
    },
  });

  // Save mutation for manual edits
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get page details
      const { data: page, error: pageError } = await supabase
        .from('pages')
        .select('book_id')
        .eq('id', pageId)
        .single();

      if (pageError || !page) {
        throw new Error('Failed to fetch page details');
      }

      // Get next version number
      const { data: versionNumber } = await supabase
        .rpc('get_next_simplified_prompt_version_number', { p_page_id: pageId });

      const { data, error } = await supabase
        .from('page_simplified_prompts')
        .insert({
          page_id: pageId,
          book_id: page.book_id,
          user_id: user.id,
          simplified_content: content,
          version_number: versionNumber || 1,
          generation_status: 'complete',
          generation_started_at: new Date().toISOString(),
          generation_completed_at: new Date().toISOString(),
          is_latest: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Simplified prompt saved successfully",
      });
      
      setIsEditing(false);
      setEditedContent('');
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['page-simplified-prompt', pageId] });
      queryClient.invalidateQueries({ queryKey: ['page-simplified-prompt-versions', pageId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save simplified prompt",
        variant: "destructive",
      });
    },
  });

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`page-simplified-prompts-${pageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_simplified_prompts',
          filter: `page_id=eq.${pageId}`,
        },
        (payload) => {
          console.log('Real-time simplified prompt update:', payload);
          
          // Invalidate queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['page-simplified-prompt', pageId] });
          queryClient.invalidateQueries({ queryKey: ['page-simplified-prompt-versions', pageId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, queryClient]);

  const startEdit = () => {
    setEditedContent(currentPrompt?.simplified_content || '');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const saveEdit = async () => {
    if (!editedContent.trim()) {
      toast({
        title: "Error",
        description: "Simplified prompt cannot be empty",
        variant: "destructive",
      });
      return;
    }

    await saveMutation.mutateAsync(editedContent);
  };

  const generateSimplifiedPrompt = async () => {
    await generateMutation.mutateAsync();
  };

  const updateEditedContent = (content: string) => {
    setEditedContent(content);
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['page-simplified-prompt', pageId] });
    queryClient.invalidateQueries({ queryKey: ['page-simplified-prompt-versions', pageId] });
  };

  return {
    currentPrompt,
    versions,
    isLoading,
    isEditing,
    editedContent,
    isGenerating: generateMutation.isPending,
    isSaving: saveMutation.isPending,
    startEdit,
    cancelEdit,
    saveEdit,
    generateSimplifiedPrompt,
    updateEditedContent,
    refreshData,
  };
}