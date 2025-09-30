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

      // Get any daily_published entry for this book
      const { data: dailyPublished } = await supabase
        .from('daily_published')
        .select('id')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!dailyPublished) return null;

      // Get the latest complete SEO metadata with an actual image
      const { data: seoData } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('daily_published_id', dailyPublished.id)
        .eq('optimization_status', 'complete')
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
