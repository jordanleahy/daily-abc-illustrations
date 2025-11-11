import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

/**
 * Hook to fetch SEO metadata for a book
 * ✅ Phase 0.4: Refactored to use direct book_id column query
 * 
 * Fetches book-level SEO (not daily-published-specific variants)
 */
export const useBookSeoMetadata = (bookId?: string) => {
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  return useQuery({
    queryKey: ['book-seo-metadata', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      console.log('🔍 [useBookSeoMetadata] Fetching SEO metadata for book_id:', bookId);

      // ✅ Phase 0.4: Direct query using book_id column
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete')
        .maybeSingle();

      if (error) {
        console.error('❌ [useBookSeoMetadata] Error fetching SEO metadata:', error);
        return null;
      }

      if (!data) {
        console.log('⚠️ [useBookSeoMetadata] No SEO metadata found for book');
        return null;
      }

      console.log('✅ [useBookSeoMetadata] Found SEO metadata:', {
        id: data.id,
        has_thumbnail: !!data.og_image_url,
        thumbnail_url: data.og_image_url
      });

      return data;
    },
    enabled: !!bookId,
    // Uses global 7-day staleTime from App.tsx for instant loading
  });
};