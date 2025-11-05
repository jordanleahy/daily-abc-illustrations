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
      
      // Fetch daily_published with books
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

      // Fetch user activity data if authenticated
      let activityData: any[] = [];
      if (user) {
        const { data: activityResponse, error: activityError } = await supabase
          .from('user_book_activity')
          .select('daily_published_id, last_viewed_at, view_count')
          .eq('user_id', user.id);

        if (activityError) {
          console.error('Error fetching user activity:', activityError);
        } else {
          activityData = activityResponse || [];
        }
      }

      // Fetch latest SEO metadata for all daily_published items
      const { data: seoData, error: seoError } = await supabase
        .from('seo_metadata')
        .select('daily_published_id, seo_title, seo_description, og_image_url')
        .eq('is_latest', true)
        .eq('is_active', true);

      if (seoError) {
        console.error('Error fetching SEO metadata:', seoError);
      }

      // Fetch first page images as fallback - query from page_image_urls table
      const bookIds = dailyPublishedData?.map(dp => dp.book_id).filter(Boolean) || [];
      const { data: firstPageImages, error: imageError } = await supabase
        .from('page_image_urls')
        .select(`
          image_url,
          pages!inner(
            page_number,
            book_id
          )
        `)
        .in('pages.book_id', bookIds)
        .eq('pages.page_number', 1)
        .eq('is_latest', true)
        .not('image_url', 'is', null);

      if (imageError) {
        console.error('Error fetching first page images:', imageError);
      }

      // Map SEO data to daily_published items
      const seoMap = new Map(
        seoData?.map(seo => [seo.daily_published_id, { 
          seo_title: seo.seo_title, 
          seo_description: seo.seo_description, 
          og_image_url: seo.og_image_url 
        }]) || []
      );

      // Map first page images by book_id
      const firstPageMap = new Map(
        firstPageImages?.map((img: any) => [img.pages.book_id, img.image_url]) || []
      );

      // Map activity data by daily_published_id
      const activityMap = new Map(
        activityData.map(act => [act.daily_published_id, {
          last_viewed_at: act.last_viewed_at,
          view_count: act.view_count
        }])
      );

      const enrichedData = dailyPublishedData?.map(item => {
        const seoData = seoMap.get(item.id);
        const fallbackImage = firstPageMap.get(item.book_id);
        const activity = activityMap.get(item.id);
        return {
          ...item,
          og_image_url: seoData?.og_image_url || fallbackImage || null,
          seo_title: seoData?.seo_title || null,
          seo_description: seoData?.seo_description || null,
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
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for library
    gcTime: 60 * 1000, // 1 minute
  });
};