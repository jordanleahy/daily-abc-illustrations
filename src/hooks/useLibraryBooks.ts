import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';
import { cacheLibraryBooks, getCachedLibraryBooks } from '@/utils/libraryCache';

export const useLibraryBooks = () => {
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  return useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to return cached data immediately for instant load
      const cachedBooks = getCachedLibraryBooks(user?.id || '');
      if (cachedBooks) {
        // Return cached data immediately, React Query will refetch in background
        return cachedBooks;
      }
      
      // ⚡ OPTIMIZED: Fetch daily_published with books JOIN
      const { data: dailyPublishedData, error: dpError } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books(
            book_name,
            book_description,
            user_id
          )
        `)
        .neq('status', 'draft');

      if (dpError) {
        console.error('Error fetching library books:', dpError);
        throw dpError;
      }

      // Fetch SEO metadata separately
      const { data: seoData } = await supabase
        .from('seo_metadata')
        .select('daily_published_id, og_image_url, seo_title, seo_description')
        .eq('is_latest', true)
        .eq('is_active', true);

      // Create SEO lookup map
      const seoMap = new Map(
        (seoData || []).map(seo => [seo.daily_published_id, seo])
      );

      // Fetch user activity separately
      const { data: activityData } = await supabase
        .from('user_book_activity')
        .select('daily_published_id, last_viewed_at, view_count')
        .eq('user_id', user?.id || '');

      // Create activity lookup map
      const activityMap = new Map(
        (activityData || []).map(activity => [activity.daily_published_id, activity])
      );

      // Fetch first page images only for books without og_image_url
      const bookIdsNeedingImages = dailyPublishedData
        ?.filter((dp: any) => {
          const seo = seoMap.get(dp.id);
          return !seo?.og_image_url && dp.book_id;
        })
        .map((dp: any) => dp.book_id) || [];
      
      let firstPageImages: any[] = [];
      if (bookIdsNeedingImages.length > 0) {
        const { data: imageData } = await supabase
          .from('page_image_urls')
          .select(`
            image_url,
            pages!inner(
              page_number,
              book_id
            )
          `)
          .in('pages.book_id', bookIdsNeedingImages)
          .eq('pages.page_number', 1)
          .eq('is_latest', true)
          .not('image_url', 'is', null)
          .limit(bookIdsNeedingImages.length);
        
        firstPageImages = imageData || [];
      }

      // Map first page images by book_id (only for fallback)
      const firstPageMap = new Map(
        firstPageImages?.map((img: any) => [img.pages.book_id, img.image_url]) || []
      );

      const enrichedData = dailyPublishedData?.map((item: any) => {
        // Get SEO metadata from map
        const seo = seoMap.get(item.id);
        
        // Get activity from map
        const activity = activityMap.get(item.id);
        
        const fallbackImage = firstPageMap.get(item.book_id);
        
        return {
          ...item,
          og_image_url: seo?.og_image_url || fallbackImage || null,
          seo_title: seo?.seo_title || null,
          seo_description: seo?.seo_description || null,
          last_viewed_at: activity?.last_viewed_at || null,
          view_count: activity?.view_count || 0,
        };
      }) || [];

      // Sort by last_viewed_at (most recent first), then by publish_date
      enrichedData.sort((a, b) => {
        // If both have view activity, sort by most recent
        if (a.last_viewed_at && b.last_viewed_at) {
          return new Date(b.last_viewed_at).getTime() - new Date(a.last_viewed_at).getTime();
        }
        // Items with activity come before items without
        if (a.last_viewed_at && !b.last_viewed_at) return -1;
        if (!a.last_viewed_at && b.last_viewed_at) return 1;
        // For items without activity, sort by publish_date
        return new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime();
      });

      // Cache the fresh data for next visit
      cacheLibraryBooks(enrichedData as DailyPublishedWithBook[], user?.id || '');

      return enrichedData as DailyPublishedWithBook[];

    },
    staleTime: 30 * 60 * 1000, // 30 minutes - aggressive cache-first for instant load
    gcTime: 60 * 60 * 1000, // 60 minutes - keep in cache much longer
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnWindowFocus: false, // Don't refetch on focus
  });
};