import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
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
  const { user } = useAuthContext();
  const { toast } = useToast();

  const { data: promptData = null, isLoading, error, refetch } = useQuery({
    queryKey: ['latest-book-system-prompt', user?.id],
    queryFn: async (): Promise<LatestBookSystemPrompt | null> => {
      if (!user?.id) return null;
      
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
          throw error;
        }

        if (data) {
          return {
            id: data.id,
            content: data.content,
            bookId: data.book_id,
            bookName: data.books.book_name,
            bookCategory: data.books.category || undefined,
            versionNumber: data.version_number,
            createdAt: data.created_at,
            sourceType: data.source_type as 'generated' | 'manual'
          };
        }

        return null;
      } catch (error) {
        console.error('Error loading latest book system prompt:', error);
        toast({
          title: "Error",
          description: "Failed to load system prompt data",
          variant: "destructive"
        });
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  return {
    promptData,
    isLoading,
    refetch
  };
};