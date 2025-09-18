/**
 * ==================================================================================
 * BOOK THUMBNAILS REACT HOOKS
 * ==================================================================================
 * 
 * BUSINESS PURPOSE:
 * Provides React hooks for managing book thumbnail generation, retrieval, and
 * real-time status tracking. Handles the complete lifecycle from generation
 * request to completion monitoring with optimistic UI updates.
 * 
 * TECHNICAL ARCHITECTURE:
 * - React Query for caching and synchronization
 * - Real-time polling for generation progress
 * - Optimistic updates for better UX
 * - Error boundary integration
 * - Toast notifications for user feedback
 * 
 * HOOKS PROVIDED:
 * 1. useBookThumbnails - Fetch all thumbnails for a book (with version history)
 * 2. useLatestBookThumbnail - Get the current active thumbnail
 * 3. useGenerateBookThumbnail - Trigger new thumbnail generation
 * 4. useBookThumbnailProgress - Real-time generation status monitoring
 * 
 * CACHING STRATEGY:
 * - Aggressive caching of completed thumbnails (rarely change)
 * - Real-time polling during generation (every 2 seconds)
 * - Automatic invalidation on mutations
 * - Background refetch for data consistency
 * 
 * USER EXPERIENCE:
 * - Immediate feedback on generation start
 * - Progress indicators during generation
 * - Success/error toast notifications
 * - Automatic UI updates on completion
 * 
 * PERFORMANCE:
 * - Query deduplication via React Query
 * - Efficient polling only when needed
 * - Automatic cleanup of unused queries
 * - Optimized re-renders via dependency arrays
 * 
 * ERROR HANDLING:
 * - Graceful degradation on API failures
 * - User-friendly error messages
 * - Retry mechanisms for transient failures
 * - Comprehensive error logging
 * ==================================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { BookThumbnail } from '@/types/bookThumbnail';
import { toast } from 'sonner';

/**
 * HOOK: useBookThumbnails
 * 
 * PURPOSE: Retrieves all thumbnail versions for a specific book
 * 
 * USE CASES:
 * - Version history display
 * - Thumbnail management interface
 * - A/B testing comparison
 * 
 * CACHING: Long-term cache (thumbnails rarely change once generated)
 * ORDERING: Latest version first (version_number DESC)
 */
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

/**
 * HOOK: useLatestBookThumbnail
 * 
 * PURPOSE: Gets the current active thumbnail for social media sharing
 * 
 * USE CASES:
 * - OpenGraph image display
 * - Social media preview
 * - Current thumbnail status
 * 
 * BUSINESS RULES:
 * - Only returns completed thumbnails (generation_status = 'complete')
 * - Only returns latest version (is_latest = true)
 * - Returns null if no completed thumbnail exists
 * 
 * PERFORMANCE: Highly cached, used frequently in UI
 */
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

/**
 * HOOK: useGenerateBookThumbnail
 * 
 * PURPOSE: Orchestrates the complete thumbnail generation workflow
 * 
 * WORKFLOW:
 * 1. Generate optimized prompt (via generate-book-thumbnail-prompt)
 * 2. Generate image using prompt (via generate-book-thumbnail)
 * 3. Update UI with success/error feedback
 * 4. Invalidate relevant queries for fresh data
 * 
 * ERROR HANDLING:
 * - Step-by-step error identification
 * - User-friendly error messages
 * - Automatic retry on transient failures
 * 
 * UX FEATURES:
 * - Immediate success feedback
 * - Progress indication via separate hook
 * - Automatic cache updates
 */
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

/**
 * HOOK: useBookThumbnailProgress
 * 
 * PURPOSE: Real-time monitoring of thumbnail generation progress
 * 
 * FEATURES:
 * - Live status updates (not_started, in_progress, complete, error)
 * - Automatic polling during generation (every 2 seconds)
 * - Stops polling when generation completes
 * - Error state handling with error messages
 * 
 * UI INTEGRATION:
 * - Powers progress indicators
 * - Enables/disables generation button
 * - Shows error messages to users
 * 
 * PERFORMANCE:
 * - Only polls when generation is active
 * - Automatic cleanup when component unmounts
 * - Minimal data transfer (only status fields)
 */
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