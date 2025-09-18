/**
 * ==================================================================================
 * BOOK THUMBNAIL PROMPT GENERATION HOOK
 * ==================================================================================
 * 
 * BUSINESS PURPOSE:
 * Provides safe, controlled prompt generation for book thumbnails, allowing users
 * to review and modify AI-generated prompts before committing to expensive image
 * generation operations.
 * 
 * SAFETY FEATURES:
 * - Prompt-only generation (no image creation)
 * - User review and editing capabilities
 * - Version control for prompt iterations
 * - Validation before image generation
 * 
 * TECHNICAL ARCHITECTURE:
 * - React Query mutation for async prompt generation
 * - Supabase Edge Function integration
 * - Error handling with user feedback
 * - Cache invalidation on success
 * ==================================================================================
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface GeneratePromptParams {
  bookId: string;
}

interface GeneratePromptResponse {
  thumbnailId: string;
  prompt: string;
  versionNumber: number;
  success: boolean;
}

/**
 * HOOK: useGenerateBookThumbnailPrompt
 * 
 * PURPOSE:
 * Generates AI-optimized prompts for book thumbnail creation without
 * immediately creating the image, allowing for review and modification.
 * 
 * WORKFLOW:
 * 1. User clicks "Generate Prompt"
 * 2. Hook calls generate-book-thumbnail-prompt edge function
 * 3. AI analyzes book metadata and generates optimized prompt
 * 4. Prompt is stored in database with version control
 * 5. User can review, edit, and approve before image generation
 * 
 * BENEFITS:
 * - Cost control (no image generation until approved)
 * - Quality control (user can refine prompts)
 * - Iterative improvement (version history)
 * - Educational (users learn what makes good prompts)
 */
export const useGenerateBookThumbnailPrompt = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ bookId }: GeneratePromptParams): Promise<GeneratePromptResponse> => {
      if (!user?.id) {
        throw new Error('User must be authenticated');
      }

      console.log('Generating thumbnail prompt for book:', bookId);

      const { data, error } = await supabase.functions.invoke(
        'generate-book-thumbnail-prompt',
        {
          body: {
            bookId,
            userId: user.id,
          },
        }
      );

      if (error) {
        console.error('Prompt generation error:', error);
        throw new Error(error.message || 'Failed to generate prompt');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate prompt');
      }

      return {
        thumbnailId: data.thumbnailId,
        prompt: data.prompt,
        versionNumber: data.versionNumber,
        success: true,
      };
    },
    onSuccess: (data) => {
      console.log('Prompt generated successfully:', {
        thumbnailId: data.thumbnailId,
        versionNumber: data.versionNumber,
        promptLength: data.prompt.length,
      });

      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ 
        queryKey: ['book-thumbnails'] 
      });
      
      toast.success('Thumbnail prompt generated successfully!');
    },
    onError: (error) => {
      console.error('Prompt generation failed:', error);
      toast.error(error.message || 'Failed to generate thumbnail prompt');
    },
  });
};