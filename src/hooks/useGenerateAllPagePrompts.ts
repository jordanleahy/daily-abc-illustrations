import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PagePromptProgress {
  current: number;
  total: number;
  currentPageId: string;
  currentPageTitle: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  results: {
    success: number;
    failed: number;
    failedPages: Array<{ pageId: string; title: string; error: string }>;
  };
}

interface GenerateAllPagePromptsParams {
  bookId: string;
  userId: string;
  pages: Array<{ id: string; letter: string; title: string }>;
}

/**
 * Hook to generate page-specific prompts for all pages in a book
 * 
 * Processes pages sequentially to avoid rate limiting and provides
 * detailed progress tracking for the UI.
 */
export function useGenerateAllPagePrompts() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<PagePromptProgress>({
    current: 0,
    total: 0,
    currentPageId: '',
    currentPageTitle: '',
    status: 'idle',
    results: {
      success: 0,
      failed: 0,
      failedPages: []
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ bookId, userId, pages }: GenerateAllPagePromptsParams) => {
      const total = pages.length;
      let successCount = 0;
      const failedPages: Array<{ pageId: string; title: string; error: string }> = [];

      setProgress({
        current: 0,
        total,
        currentPageId: '',
        currentPageTitle: '',
        status: 'processing',
        results: { success: 0, failed: 0, failedPages: [] }
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Update progress before processing
        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentPageId: page.id,
          currentPageTitle: `${page.letter}: ${page.title}`
        }));

        try {
          // Call edge function for this page
          const { data, error } = await supabase.functions.invoke('generate-page-prompt', {
            body: {
              pageId: page.id,
              userId,
              bookId
            }
          });

          if (error || !data?.success) {
            throw new Error(data?.error || error?.message || 'Failed to generate prompt');
          }

          successCount++;
          setProgress(prev => ({
            ...prev,
            results: { ...prev.results, success: successCount }
          }));

          // Small delay to avoid rate limiting (adjust as needed)
          if (i < pages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error: any) {
          console.error(`Failed to generate prompt for page ${page.id}:`, error);
          
          failedPages.push({
            pageId: page.id,
            title: `${page.letter}: ${page.title}`,
            error: error.message
          });

          setProgress(prev => ({
            ...prev,
            results: {
              ...prev.results,
              failed: failedPages.length,
              failedPages
            }
          }));

          // Handle rate limiting - stop if we hit rate limits
          if (error.message.includes('Rate limit') || error.message.includes('429')) {
            toast.error('Rate limit exceeded', {
              description: `Generated ${successCount} of ${total} prompts before hitting rate limit`
            });
            break;
          }
        }
      }

      return {
        total,
        success: successCount,
        failed: failedPages.length,
        failedPages
      };
    },
    onSuccess: (results) => {
      // Mark processing as complete
      setProgress(prev => ({
        ...prev,
        status: 'complete'
      }));

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['pageSystemPrompts'] });

      // Show success message
      if (results.failed === 0) {
        toast.success(`All ${results.success} page prompts generated!`, {
          description: 'Images can now be generated with consistent styling'
        });
      } else {
        toast.warning(`Generated ${results.success} of ${results.total} prompts`, {
          description: `${results.failed} pages failed - check details below`
        });
      }
    },
    onError: (error: Error) => {
      setProgress(prev => ({
        ...prev,
        status: 'error'
      }));

      console.error('Batch page prompt generation failed:', error);
      toast.error('Failed to generate page prompts', {
        description: error.message
      });
    }
  });

  const reset = () => {
    setProgress({
      current: 0,
      total: 0,
      currentPageId: '',
      currentPageTitle: '',
      status: 'idle',
      results: {
        success: 0,
        failed: 0,
        failedPages: []
      }
    });
  };

  return {
    generateAllPagePrompts: mutation.mutate,
    isGenerating: mutation.isPending,
    progress,
    error: mutation.error,
    reset
  };
}
