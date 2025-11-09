import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

/**
 * Admin hook for SEO metadata - shows ANY complete SEO for book
 * ✅ Phase 0.4: Refactored to use direct book_id column query
 * 
 * No restrictions on daily_published status, gets latest complete SEO with image
 */
export const useAdminBookSeoMetadata = (bookId?: string) => {
  useSeoMetadataSubscription();
  
  return useQuery({
    queryKey: ['admin-book-seo-metadata', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      console.log('🔍 [useAdminBookSeoMetadata] Fetching SEO for book_id:', bookId);

      // ✅ Phase 0.4: Direct query using book_id column
      // Get most recent complete SEO with image (admin view needs thumbnail)
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('book_id', bookId)
        .eq('optimization_status', 'complete')
        .not('og_image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ [useAdminBookSeoMetadata] Error:', error);
        return null;
      }

      if (!data) {
        console.log('⚠️ [useAdminBookSeoMetadata] No SEO found');
        return null;
      }

      console.log('✅ [useAdminBookSeoMetadata] Found SEO:', data.id);
      return data;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
