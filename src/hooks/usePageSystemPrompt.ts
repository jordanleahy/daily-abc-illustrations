import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageSystemPrompt, PageSystemPromptVersion } from '@/types/pageSystemPrompt';
import { useToast } from '@/hooks/use-toast';

export function usePageSystemPrompt(pageId: string) {
  const [currentPrompt, setCurrentPrompt] = useState<PageSystemPrompt | null>(null);
  const [versions, setVersions] = useState<PageSystemPromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!pageId) return;

    try {
      setIsLoading(true);

      // Get current latest prompt (order by version_number desc to handle multiple is_latest=true cases)
      const { data: currentData, error: currentError } = await supabase
        .from('page_system_prompts')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_latest', true)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (currentError) throw currentError;
      setCurrentPrompt(currentData);

      // Get all versions
      const { data: versionsData, error: versionsError } = await supabase
        .from('page_system_prompts')
        .select('*')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false });

      if (versionsError) throw versionsError;
      setVersions(versionsData || []);

    } catch (error) {
      console.error('Error loading page system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to load page system prompt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageId, toast]);

  // Real-time subscription
  useEffect(() => {
    if (!pageId) return;

    const channel = supabase
      .channel(`page_system_prompts:${pageId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_system_prompts',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('Page system prompt INSERT:', payload);
          const newPrompt = payload.new as PageSystemPrompt;
          if (newPrompt.is_latest) {
            setCurrentPrompt(newPrompt);
          }
          setVersions(prev => [newPrompt, ...prev]);
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'page_system_prompts',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('Page system prompt UPDATE:', payload);
          const updatedPrompt = payload.new as PageSystemPrompt;
          
          setVersions(prev => 
            prev.map(version => 
              version.id === updatedPrompt.id ? updatedPrompt : version
            )
          );
          
          if (updatedPrompt.is_latest) {
            setCurrentPrompt(updatedPrompt);
          }
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'DELETE',
          schema: 'public',
          table: 'page_system_prompts',
          filter: `page_id=eq.${pageId}`
        },
        (payload) => {
          console.log('Page system prompt DELETE:', payload);
          const deletedId = payload.old.id;
          setVersions(prev => prev.filter(version => version.id !== deletedId));
          
          if (currentPrompt?.id === deletedId) {
            setCurrentPrompt(null);
          }
        }
      )
      .subscribe();

    loadData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, loadData]);

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setEditedContent(currentPrompt?.content || '');
  }, [currentPrompt]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedContent('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!pageId || !editedContent.trim()) return;

    try {
      // Get page and book info for user_id and book_id
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
      const { error: insertError } = await supabase
        .from('page_system_prompts')
        .insert({
          page_id: pageId,
          book_id: pageData.book_id,
          user_id: user.id,
          content: editedContent.trim(),
          version_number: versionData,
          is_latest: true,
          source_type: 'manual',
          prompt_status: 'complete'
        });

      if (insertError) throw insertError;

      setIsEditing(false);
      setEditedContent('');
      await loadData();

      toast({
        title: "Success",
        description: "Page system prompt saved successfully",
      });

    } catch (error) {
      console.error('Error saving page system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save page system prompt",
        variant: "destructive",
      });
    }
  }, [pageId, editedContent, loadData, toast]);

  const deployVersion = useCallback(async (versionId: string) => {
    try {
      const { error } = await supabase
        .from('page_system_prompts')
        .update({ is_deployed: true })
        .eq('id', versionId);

      if (error) throw error;

      await loadData();

      toast({
        title: "Success",
        description: "Page system prompt deployed successfully",
      });

    } catch (error) {
      console.error('Error deploying page system prompt version:', error);
      toast({
        title: "Error",
        description: "Failed to deploy page system prompt version",
        variant: "destructive",
      });
    }
  }, [loadData, toast]);

  const revertToVersion = useCallback(async (versionId: string) => {
    if (!pageId) return;

    try {
      const versionToRevert = versions.find(v => v.id === versionId);
      if (!versionToRevert) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get next version number
      const { data: versionData, error: versionError } = await supabase
        .rpc('get_next_page_prompt_version_number', { p_page_id: pageId });

      if (versionError) throw versionError;

      // Create new version based on the reverted version
      const { error: insertError } = await supabase
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
        });

      if (insertError) throw insertError;

      await loadData();

      toast({
        title: "Success",
        description: `Reverted to version ${versionToRevert.version_number}`,
      });

    } catch (error) {
      console.error('Error reverting page system prompt version:', error);
      toast({
        title: "Error",
        description: "Failed to revert to selected version",
        variant: "destructive",
      });
    }
  }, [pageId, versions, loadData, toast]);

  const updateEditedContent = useCallback((content: string) => {
    setEditedContent(content);
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

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
    refreshData
  };
}