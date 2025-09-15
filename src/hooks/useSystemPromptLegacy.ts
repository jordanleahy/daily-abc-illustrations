import { useState, useEffect } from 'react';
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
  const [currentPrompt, setCurrentPrompt] = useState<SystemPrompt | null>(null);
  const [versions, setVersions] = useState<SystemPromptVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const { toast } = useToast();

  // Load data function that can be called externally
  const loadData = async () => {
    if (!bookId) return;
    
    setIsLoading(true);
    
    try {
      // Fetch current prompt (latest version)
      const { data: currentData, error: currentError } = await supabase
        .from('book_system_prompts')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .maybeSingle();

      if (currentError) {
        console.error('Error fetching current prompt:', currentError);
      } else if (currentData) {
        setCurrentPrompt({
          id: currentData.id,
          content: currentData.content,
          versionNumber: currentData.version_number,
          isDeployed: currentData.is_deployed,
          lastModified: currentData.updated_at,
          deployedAt: currentData.deployed_at || undefined,
          sourceType: currentData.source_type as 'generated' | 'manual',
          generationMetadata: currentData.generation_metadata,
          promptStatus: currentData.prompt_status
        });
      }

      // Fetch all versions
      const { data: versionsData, error: versionsError } = await supabase
        .from('book_system_prompts')
        .select('*')
        .eq('book_id', bookId)
        .order('version_number', { ascending: false });

      if (versionsError) {
        console.error('Error fetching versions:', versionsError);
      } else {
        setVersions(versionsData.map(v => ({
          id: v.id,
          content: v.content,
          versionNumber: v.version_number,
          createdAt: v.created_at,
          isDeployed: v.is_deployed,
          deployedAt: v.deployed_at || undefined,
          sourceType: v.source_type as 'generated' | 'manual',
          generationMetadata: v.generation_metadata,
          promptStatus: v.prompt_status
        })));
      }
    } catch (error) {
      console.error('Error loading system prompt data:', error);
      toast({
        title: "Error",
        description: "Failed to load system prompt data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data and set up real-time subscription
  useEffect(() => {
    if (bookId) {
      loadData();
      
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
            console.log('Real-time update received:', payload);
            
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
              
              setVersions(prev => [newVersion, ...prev]);
              
              // If this is the latest version, update current prompt
              if (newPrompt.is_latest) {
                setCurrentPrompt({
                  id: newPrompt.id,
                  content: newPrompt.content,
                  versionNumber: newPrompt.version_number,
                  isDeployed: newPrompt.is_deployed,
                  lastModified: newPrompt.updated_at,
                  deployedAt: newPrompt.deployed_at || undefined,
                  sourceType: newPrompt.source_type as 'generated' | 'manual',
                  generationMetadata: newPrompt.generation_metadata,
                  promptStatus: newPrompt.prompt_status
                });
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
              
              setVersions(prev => 
                prev.map(version => 
                  version.id === updatedPrompt.id ? updatedVersion : version
                )
              );
              
              // Update current prompt if this is the latest or deployed version
              if (updatedPrompt.is_latest || updatedPrompt.is_deployed) {
                setCurrentPrompt(prev => {
                  if (prev && prev.id === updatedPrompt.id) {
                    return {
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
                  }
                  return prev;
                });
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setVersions(prev => prev.filter(version => version.id !== deletedId));
              
              // If the deleted prompt was the current one, clear it
              setCurrentPrompt(prev => {
                if (prev && prev.id === deletedId) {
                  return null;
                }
                return prev;
              });
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount or bookId change
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [bookId, toast]);

  const startEdit = () => {
    setIsEditing(true);
    setEditedContent(currentPrompt?.content || '');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const saveEdit = async () => {
    if (!editedContent.trim()) return;
    
    setIsLoading(true);
    
    try {
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

      if (error) {
        throw error;
      }

      // Update state
      const updatedPrompt: SystemPrompt = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.version_number,
        isDeployed: newPrompt.is_deployed,
        lastModified: newPrompt.updated_at,
        sourceType: newPrompt.source_type as 'generated' | 'manual',
        generationMetadata: newPrompt.generation_metadata
      };

      const newVersion: SystemPromptVersion = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.version_number,
        createdAt: newPrompt.created_at,
        isDeployed: newPrompt.is_deployed,
        sourceType: newPrompt.source_type as 'generated' | 'manual',
        generationMetadata: newPrompt.generation_metadata
      };

      setCurrentPrompt(updatedPrompt);
      setVersions(prev => [newVersion, ...prev.map(v => ({ ...v, isLatest: false }))]);
      setIsEditing(false);
      setEditedContent('');
      
      toast({
        title: "Success",
        description: "System prompt saved successfully"
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save system prompt",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deployVersion = async (versionId: string) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('book_system_prompts')
        .update({ is_deployed: true })
        .eq('id', versionId);

      if (error) {
        throw error;
      }

      // Refresh data
      const { data: updatedPrompt } = await supabase
        .from('book_system_prompts')
        .select('*')
        .eq('id', versionId)
        .single();

      if (updatedPrompt) {
        setCurrentPrompt({
          id: updatedPrompt.id,
          content: updatedPrompt.content,
          versionNumber: updatedPrompt.version_number,
          isDeployed: updatedPrompt.is_deployed,
          lastModified: updatedPrompt.updated_at,
          deployedAt: updatedPrompt.deployed_at || undefined,
          sourceType: updatedPrompt.source_type as 'generated' | 'manual',
          generationMetadata: updatedPrompt.generation_metadata
        });

        setVersions(prev => prev.map(v => ({
          ...v,
          isDeployed: v.id === versionId,
          deployedAt: v.id === versionId ? updatedPrompt.deployed_at : v.deployedAt
        })));
      }

      toast({
        title: "Success",
        description: "Version deployed successfully"
      });
    } catch (error) {
      console.error('Error deploying version:', error);
      toast({
        title: "Error",
        description: "Failed to deploy version",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const revertToVersion = async (versionId: string) => {
    setIsLoading(true);
    
    try {
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

      if (error) {
        throw error;
      }

      // Update state
      const updatedPrompt: SystemPrompt = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.version_number,
        isDeployed: newPrompt.is_deployed,
        lastModified: newPrompt.updated_at,
        sourceType: newPrompt.source_type as 'generated' | 'manual',
        generationMetadata: newPrompt.generation_metadata
      };

      const newVersion: SystemPromptVersion = {
        id: newPrompt.id,
        content: newPrompt.content,
        versionNumber: newPrompt.version_number,
        createdAt: newPrompt.created_at,
        isDeployed: newPrompt.is_deployed,
        sourceType: newPrompt.source_type as 'generated' | 'manual',
        generationMetadata: newPrompt.generation_metadata
      };

      setCurrentPrompt(updatedPrompt);
      setVersions(prev => [newVersion, ...prev]);
      
      toast({
        title: "Success",
        description: `Reverted to version ${versionToRevert.versionNumber}`
      });
    } catch (error) {
      console.error('Error reverting version:', error);
      toast({
        title: "Error",
        description: "Failed to revert to version",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateEditedContent = (content: string) => {
    setEditedContent(content);
  };

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
    refreshData: loadData,
  };
};