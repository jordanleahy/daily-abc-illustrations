import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

/**
 * Hook to fetch SEO metadata for a book (not tied to daily published content)
 * This will look for SEO metadata that was created specifically for this book
 */
export const useBookSeoMetadata = (bookId?: string) => {
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  return useQuery({
    queryKey: ['book-seo-metadata', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      console.log('🔍 [useBookSeoMetadata] Fetching SEO metadata for book_id:', bookId);

      // Try to get ALL daily_published entries for this book to find the best one
      const { data: dailyPublishedEntries, error: dailyError } = await supabase
        .from('daily_published')
        .select('id, status, created_at')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (dailyError) {
        console.error('❌ [useBookSeoMetadata] Error fetching daily published entries:', dailyError);
        return null;
      }

      if (!dailyPublishedEntries || dailyPublishedEntries.length === 0) {
        console.log('⚠️ [useBookSeoMetadata] No daily published entries found for book');
        return null;
      }

      console.log('📝 [useBookSeoMetadata] Found daily published entries:', dailyPublishedEntries);

      // Look for SEO metadata for each daily published entry, prioritizing active/queued over expired/draft
      const priorityOrder = ['active', 'queued', 'expired', 'draft'];
      let bestDailyPublished = null;
      let bestSeoData = null;

      for (const priority of priorityOrder) {
        const entries = dailyPublishedEntries.filter(entry => entry.status === priority);
        
        for (const entry of entries) {
          const { data: seoData, error: seoError } = await supabase
            .from('seo_metadata')
            .select('*')
            .eq('daily_published_id', entry.id)
            .eq('is_latest', true)
            .eq('is_active', true)
            .eq('optimization_status', 'complete')
            .maybeSingle();

          if (!seoError && seoData) {
            console.log(`✅ [useBookSeoMetadata] Found SEO metadata for ${priority} entry:`, {
              daily_published_id: entry.id,
              status: entry.status,
              has_thumbnail: !!seoData.og_image_url,
              thumbnail_url: seoData.og_image_url
            });
            
            bestDailyPublished = entry;
            bestSeoData = seoData;
            break;
          }
        }
        
        if (bestSeoData) break;
      }

      if (!bestSeoData) {
        console.log('⚠️ [useBookSeoMetadata] No SEO metadata found for any daily published entry');
        return null;
      }

      return bestSeoData;
    },
    enabled: !!bookId,
    staleTime: 1 * 60 * 1000, // 1 minute (more aggressive refresh)
    gcTime: 3 * 60 * 1000, // 3 minutes
  });
};