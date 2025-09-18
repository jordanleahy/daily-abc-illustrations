import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch SEO metadata for daily published content
 */
export const useSeoMetadata = (dailyPublishedId?: string) => {
  return useQuery({
    queryKey: ['seo-metadata', dailyPublishedId],
    queryFn: async () => {
      if (!dailyPublishedId) return null;

      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('daily_published_id', dailyPublishedId)
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete')
        .maybeSingle();

      if (error) {
        console.error('Error fetching SEO metadata:', error);
        return null;
      }

      return data;
    },
    enabled: !!dailyPublishedId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch SEO metadata by book ID (for draft content)
 */
export const useSeoMetadataByBook = (bookId?: string) => {
  return useQuery({
    queryKey: ['seo-metadata-book', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      // Get SEO metadata that was generated for this book
      // This would be stored with book info in source_data
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete')
        .like('source_data', `%"bookId":"${bookId}"%`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching SEO metadata by book:', error);
        return null;
      }

      return data;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};