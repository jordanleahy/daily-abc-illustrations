import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneratePagePromptsResponse {
  success: boolean;
  message?: string;
  promptsCreated?: number;
  totalPages?: number;
  error?: string;
}

/**
 * Hook to generate/regenerate page system prompts for a book
 * Useful for enhancing existing books with rich, context-aware image prompts
 */
export const useGeneratePagePrompts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string): Promise<GeneratePagePromptsResponse> => {
      const { data, error } = await supabase.functions.invoke('generate-page-system-prompts', {
        body: { bookId },
      });

      if (error) {
        console.error('Error generating page prompts:', error);
        throw new Error(error.message || 'Failed to generate page prompts');
      }

      return data;
    },
    onSuccess: (data, bookId) => {
      if (data.success) {
        toast.success(data.message || `Generated ${data.promptsCreated} page prompts successfully!`);
        
        // Invalidate relevant queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ['book', bookId] });
        queryClient.invalidateQueries({ queryKey: ['book-pages', bookId] });
        queryClient.invalidateQueries({ queryKey: ['page-system-prompts'] });
      } else {
        toast.error(data.error || 'Failed to generate page prompts');
      }
    },
    onError: (error) => {
      console.error('Generate page prompts error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate page prompts');
    },
  });
};
