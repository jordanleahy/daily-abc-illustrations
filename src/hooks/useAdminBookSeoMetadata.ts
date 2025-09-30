import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

/**
 * Simplified hook for admin view - shows ANY complete SEO metadata
 * No restrictions on daily_published status or activation state
 */
export const useAdminBookSeoMetadata = (bookId?: string) => {
  useSeoMetadataSubscription();
  
  return useQuery({
    queryKey: ['admin-book-seo-metadata', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      // Get recent daily_published entries for this book (most recent first)
      const { data: dailyPublishedList } = await supabase
        .from('daily_published')
        .select('id, status')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!dailyPublishedList || dailyPublishedList.length === 0) return null;

      const dpIds = dailyPublishedList.map((d) => d.id);

      // Get the latest complete SEO metadata with an actual image across recent daily_published entries
      const { data: seoData } = await supabase
        .from('seo_metadata')
        .select('*')
        .in('daily_published_id', dpIds)
        .eq('optimization_status', 'complete')
        .eq('is_active', true)
        .not('og_image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return seoData;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
