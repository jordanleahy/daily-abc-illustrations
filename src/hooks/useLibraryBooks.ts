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
        .neq('status', 'draft')
        .order('publish_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (dpError) {
        console.error('Error fetching library books:', dpError);
        throw dpError;
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

      const enrichedData = dailyPublishedData?.map(item => {
        const seoData = seoMap.get(item.id);
        const fallbackImage = firstPageMap.get(item.book_id);
        return {
          ...item,
          og_image_url: seoData?.og_image_url || fallbackImage || null,
          seo_title: seoData?.seo_title || null,
          seo_description: seoData?.seo_description || null
        };
      }) || [];

      return enrichedData as DailyPublishedWithBook[];

    },
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for library
    gcTime: 60 * 1000, // 1 minute
  });
};