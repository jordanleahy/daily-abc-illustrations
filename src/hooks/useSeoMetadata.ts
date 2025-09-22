import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

/**
 * Hook to fetch SEO metadata for daily published content
 */
export const useSeoMetadata = (dailyPublishedId?: string) => {
  // Enable real-time subscriptions
  useSeoMetadataSubscription();
  return useQuery({
    queryKey: ['seo-metadata', dailyPublishedId],
    queryFn: async () => {
      if (!dailyPublishedId) return null;

      console.log('🔍 [DEBUG] Fetching SEO metadata for daily_published_id:', dailyPublishedId);

      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('daily_published_id', dailyPublishedId)
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete')
        .maybeSingle();

      if (error) {
        console.error('❌ [DEBUG] Error fetching SEO metadata:', error);
        return null;
      }

      console.log('✅ [DEBUG] SEO metadata fetched:', data);
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

      console.log('🔍 [DEBUG] Fetching SEO metadata by book_id:', bookId);

      // Get SEO metadata that was generated for this book
      // Use contains() for better JSONB querying instead of like()
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete')
        .contains('source_data', { bookId })
        .maybeSingle();

      if (error) {
        console.error('❌ [DEBUG] Error fetching SEO metadata by book:', error);
        return null;
      }

      console.log('✅ [DEBUG] SEO metadata by book fetched:', data);
      return data;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};