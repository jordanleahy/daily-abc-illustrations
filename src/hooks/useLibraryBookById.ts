import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublished } from '@/types/dailyPublished';
import { useDailyPublishedSubscription } from './useDailyPublishedSubscription';
import { isValidUUID } from '@/utils/uuid';

export const useLibraryBookById = (id: string | undefined) => {
  // Enable real-time subscriptions
  useDailyPublishedSubscription();
  
  return useQuery({
    queryKey: ['library-book', id],
    queryFn: async () => {
      if (!id || !isValidUUID(id)) {
        console.warn('useLibraryBookById: Invalid id provided, skipping query', id);
        return null;
      }
      
      // First fetch daily_published with book info
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_published')
        .select(`
          *,
          book:books(
            total_pages
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (dailyError) {
        console.error('Error fetching library book by id:', dailyError);
        throw dailyError;
      }

      if (!dailyData) return null;

      // Then fetch pages with images for this book (one query, uses index)
      // LEFT JOIN: Return all pages even if they don't have images yet
      const { data: pagesData, error: pagesError } = await supabase
        .from('pages')
        .select(`
          id,
          book_id,
          letter,
          page_number,
          page_type,
          title,
          description,
          content,
          current_system_prompt_id,
          created_at,
          updated_at,
          page_images:page_image_urls(
            id,
            image_url,
            version_number
          )
        `)
        .eq('book_id', dailyData.book_id)
        .eq('page_images.is_latest', true)
        .order('page_number', { ascending: true });

      if (pagesError) {
        console.warn('Error fetching pages:', pagesError);
        // Don't throw, return daily data without pages
        return { ...dailyData, pages: [] };
      }

      console.log('useLibraryBookById: Query result:', { dailyData, pagesData });

      return { ...dailyData, pages: pagesData || [] };
    },
    enabled: !!id && isValidUUID(id),
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnMount: false, // Use cached data for returning users
    refetchOnWindowFocus: false, // Prevent unnecessary refetches (realtime handles updates)
  });
};