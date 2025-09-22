import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch SEO metadata for a book (not tied to daily published content)
 * This will look for SEO metadata that was created specifically for this book
 */
export const useBookSeoMetadata = (bookId?: string) => {
  return useQuery({
    queryKey: ['book-seo-metadata', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      // First, get the actual daily_published entry for this book
      const { data: dailyPublished, error: dailyError } = await supabase
        .from('daily_published')
        .select('id')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (dailyError) {
        console.error('Error fetching daily published entry:', dailyError);
        return null;
      }

      if (!dailyPublished) {
        return null; // No daily published entry, so no SEO metadata
      }

      // Now look for SEO metadata using the actual daily_published_id
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('daily_published_id', dailyPublished.id)
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete')
        .maybeSingle();

      if (error) {
        console.error('Error fetching book SEO metadata:', error);
        return null;
      }

      return data;
    },
    enabled: !!bookId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};