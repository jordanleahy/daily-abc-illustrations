import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface LatestBookSystemPrompt {
  id: string;
  content: string;
  bookId: string;
  bookName: string;
  bookCategory?: string;
  versionNumber: number;
  createdAt: string;
  sourceType: 'generated' | 'manual';
}

export const useLatestBookSystemPrompt = () => {
  const [promptData, setPromptData] = useState<LatestBookSystemPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLatestPrompt = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Fetch the most recent book system prompt with book details
      const { data, error } = await supabase
        .from('book_system_prompts')
        .select(`
          id,
          content,
          book_id,
          version_number,
          created_at,
          source_type,
          books!book_system_prompts_book_id_fkey(
            book_name,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest book system prompt:', error);
        toast({
          title: "Error",
          description: "Failed to load latest system prompt",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setPromptData({
          id: data.id,
          content: data.content,
          bookId: data.book_id,
          bookName: data.books.book_name,
          bookCategory: data.books.category || undefined,
          versionNumber: data.version_number,
          createdAt: data.created_at,
          sourceType: data.source_type as 'generated' | 'manual'
        });
      } else {
        setPromptData(null);
      }
    } catch (error) {
      console.error('Error loading latest book system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to load system prompt data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestPrompt();
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('latest-book-system-prompts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'book_system_prompts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refetch when new prompt is created
          fetchLatestPrompt();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    promptData,
    isLoading,
    refetch: fetchLatestPrompt
  };
};