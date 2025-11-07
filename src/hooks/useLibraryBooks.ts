import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';

export const useLibraryBooks = () => {
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  return useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // ⚡ OPTIMIZED: Single query with all JOINs instead of 4 separate queries
      const { data: dailyPublishedData, error: dpError } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books(
            book_name,
            book_description,
            user_id
          ),
          seo_metadata!daily_published_id(
            seo_title,
            seo_description, 
            og_image_url,
            is_latest,
            is_active
          ),
          user_book_activity!daily_published_id(
            last_viewed_at,
            view_count,
            user_id
          )
        `)
        .neq('status', 'draft');

      if (dpError) {
        console.error('Error fetching library books:', dpError);
        throw dpError;
      }

      // Fetch first page images only for books without og_image_url
      const bookIdsNeedingImages = dailyPublishedData
        ?.filter((dp: any) => {
          const seoArr = Array.isArray(dp.seo_metadata) ? dp.seo_metadata : [dp.seo_metadata].filter(Boolean);
          return !seoArr[0]?.og_image_url && dp.book_id;
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
        const seoArr = Array.isArray(item.seo_metadata) ? item.seo_metadata : [item.seo_metadata].filter(Boolean);
        const activityArr = Array.isArray(item.user_book_activity) ? item.user_book_activity : [item.user_book_activity].filter(Boolean);
        
        // Filter SEO metadata to only include latest and active
        const seo = seoArr.find((s: any) => s?.is_latest && s?.is_active);
        
        // Filter activity to only include current user's activity
        const activity = activityArr.find((a: any) => a?.user_id === user?.id);
        
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

      return enrichedData as DailyPublishedWithBook[];

    },
    staleTime: 2 * 60 * 1000, // 2 minutes - reduce refetch frequency
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache longer
  });
};