import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { BookThumbnail } from '@/types/bookThumbnail';
import { toast } from 'sonner';

export const useBookThumbnails = (bookId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['book-thumbnails', bookId],
    queryFn: async () => {
      if (!bookId || !user?.id) return [];

      const { data, error } = await supabase
        .from('book_thumbnails')
        .select('*')
        .eq('book_id', bookId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching book thumbnails:', error);
        throw error;
      }

      return data as BookThumbnail[];
    },
    enabled: !!(bookId && user?.id),
  });
};

export const useLatestBookThumbnail = (bookId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['book-thumbnail-latest', bookId],
    queryFn: async () => {
      if (!bookId || !user?.id) return null;

      const { data, error } = await supabase
        .from('book_thumbnails')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .eq('generation_status', 'complete')
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest book thumbnail:', error);
        throw error;
      }

      return data as BookThumbnail | null;
    },
    enabled: !!(bookId && user?.id),
  });
};

export const useGenerateBookThumbnail = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId }: { bookId: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Step 1: Generate prompt
      const { data: promptData, error: promptError } = await supabase.functions.invoke(
        'generate-book-thumbnail-prompt',
        {
          body: { bookId, userId: user.id }
        }
      );

      if (promptError) {
        throw new Error(`Failed to generate prompt: ${promptError.message}`);
      }

      if (!promptData?.success) {
        throw new Error(promptData?.error || 'Failed to generate thumbnail prompt');
      }

      // Step 2: Generate thumbnail image
      const { data: thumbnailData, error: thumbnailError } = await supabase.functions.invoke(
        'generate-book-thumbnail',
        {
          body: { recordId: promptData.thumbnailId, userId: user.id }
        }
      );

      if (thumbnailError) {
        throw new Error(`Failed to generate thumbnail: ${thumbnailError.message}`);
      }

      if (!thumbnailData?.success) {
        throw new Error(thumbnailData?.error || 'Failed to generate thumbnail image');
      }

      return {
        thumbnailId: promptData.thumbnailId,
        thumbnailUrl: thumbnailData.thumbnailUrl,
        versionNumber: promptData.versionNumber
      };
    },
    onSuccess: (data, variables) => {
      toast.success('Book thumbnail generated successfully!');
      
      // Invalidate and refetch thumbnail queries
      queryClient.invalidateQueries({ queryKey: ['book-thumbnails', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['book-thumbnail-latest', variables.bookId] });
    },
    onError: (error) => {
      console.error('Error generating book thumbnail:', error);
      toast.error(`Failed to generate thumbnail: ${error.message}`);
    },
  });
};

export const useBookThumbnailProgress = (bookId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['book-thumbnail-progress', bookId],
    queryFn: async () => {
      if (!bookId || !user?.id) return null;

      const { data, error } = await supabase
        .from('book_thumbnails')
        .select('id, generation_status, error_message, is_latest, version_number')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching thumbnail progress:', error);
        return null;
      }

      return data;
    },
    enabled: !!(bookId && user?.id),
    refetchInterval: (query) => {
      // Poll every 2 seconds if generation is in progress
      return query.state.data?.generation_status === 'in_progress' ? 2000 : false;
    },
  });
};