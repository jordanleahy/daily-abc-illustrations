import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

/**
 * PHASE 3 OPTIMIZATION: Batch fetch SEO metadata for multiple daily published items
 * Reduces database queries from N to 1 for schedule pages with many items
 */
export const useBatchSeoMetadata = (dailyPublishedIds: string[]) => {
  // Enable real-time subscriptions
  useSeoMetadataSubscription();
  
  return useQuery({
    queryKey: ['seo-metadata-batch', dailyPublishedIds.sort().join(',')],
    queryFn: async () => {
      if (!dailyPublishedIds || dailyPublishedIds.length === 0) {
        return {};
      }

      console.log(`🔍 [Batch SEO] Fetching metadata for ${dailyPublishedIds.length} items`);

      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .in('daily_published_id', dailyPublishedIds)
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete');

      if (error) {
        console.error('❌ [Batch SEO] Error fetching metadata:', error);
        return {};
      }

      // Convert array to map for O(1) lookups
      const metadataMap: Record<string, typeof data[0]> = {};
      data?.forEach((item) => {
        if (item.daily_published_id) {
          metadataMap[item.daily_published_id] = item;
        }
      });

      console.log(`✅ [Batch SEO] Fetched ${Object.keys(metadataMap).length} metadata records`);
      return metadataMap;
    },
    enabled: dailyPublishedIds.length > 0,
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches (realtime handles updates)
  });
};
