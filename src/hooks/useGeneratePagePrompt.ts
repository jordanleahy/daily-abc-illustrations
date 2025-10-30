import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneratePagePromptParams {
  pageId: string;
  userId: string;
  bookId: string;
}

interface GeneratePagePromptResponse {
  success: boolean;
  pagePromptId?: string;
  pageId?: string;
  content?: string;
  versionNumber?: number;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Hook to generate a page-specific image prompt using the Graphics Designer Agent
 * 
 * This creates detailed, structured prompts based on:
 * - The book's deployed style guide
 * - The specific page details (letter, title, description, content)
 * 
 * The generated prompt is stored in page_system_prompts and deployed immediately
 * for use in image generation.
 */
export function useGeneratePagePrompt() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ pageId, userId, bookId }: GeneratePagePromptParams) => {
      const { data, error } = await supabase.functions.invoke<GeneratePagePromptResponse>(
        'generate-page-prompt',
        {
          body: { pageId, userId, bookId }
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to generate page prompt');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate page prompt');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['pageSystemPrompt', variables.pageId] });
      queryClient.invalidateQueries({ queryKey: ['pageSystemPrompts', variables.pageId] });
      queryClient.invalidateQueries({ queryKey: ['pages', variables.bookId] });

      toast.success('Page prompt generated successfully!', {
        description: data.message || 'Ready to use for image generation'
      });
    },
    onError: (error: Error) => {
      console.error('Failed to generate page prompt:', error);
      
      // Handle specific error cases
      if (error.message.includes('Rate limit')) {
        toast.error('Rate limit exceeded', {
          description: 'Please try again in a few moments'
        });
      } else if (error.message.includes('Payment required')) {
        toast.error('Credits required', {
          description: 'Please add credits to your Lovable AI workspace'
        });
      } else if (error.message.includes('style guide')) {
        toast.error('Style guide missing', {
          description: 'Generate a book style guide first'
        });
      } else {
        toast.error('Failed to generate page prompt', {
          description: error.message
        });
      }
    }
  });

  return {
    generatePagePrompt: mutation.mutate,
    isGenerating: mutation.isPending,
    error: mutation.error,
    data: mutation.data
  };
}
