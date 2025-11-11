import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadataSubscription } from './useSeoMetadataSubscription';
import { cacheLibraryBooks, getCachedLibraryBooks } from '@/utils/libraryCache';

export const useLibraryBooks = () => {
  const queryClient = useQueryClient();
  
  // Enable real-time subscriptions for SEO metadata updates
  useSeoMetadataSubscription();
  
  // Real-time subscription for user book activity, books, and daily_published
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const channel = supabase
        .channel('library-realtime-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_book_activity',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('User book activity changed:', payload);
            queryClient.invalidateQueries({ queryKey: ['library-books'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'books',
          },
          (payload) => {
            console.log('Book changed for library:', payload);
            queryClient.invalidateQueries({ queryKey: ['library-books'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'daily_published',
          },
          (payload) => {
            console.log('Daily published changed for library:', payload);
            queryClient.invalidateQueries({ queryKey: ['library-books'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = getUser();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [queryClient]);
  
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
            user_id,
            created_at
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

      // Deduplicate by book_id - prefer active status, then most recent
      const bookMap = new Map();
      enrichedData.forEach(item => {
        if (!item.book_id) return;
        
        const existing = bookMap.get(item.book_id);
        if (!existing) {
          bookMap.set(item.book_id, item);
          return;
        }
        
        // Prefer active over other statuses
        if (item.status === 'active' && existing.status !== 'active') {
          bookMap.set(item.book_id, item);
          return;
        }
        
        // If both same status, prefer newer publish_date
        if (item.status === existing.status) {
          const itemDate = new Date(item.publish_date).getTime();
          const existingDate = new Date(existing.publish_date).getTime();
          if (itemDate > existingDate) {
            bookMap.set(item.book_id, item);
          }
        }
      });
      
      // Convert map back to array
      const deduplicatedData = Array.from(bookMap.values());
      
      // Sort by books.created_at (newest first)
      deduplicatedData.sort((a, b) => {
        const aCreatedAt = a.book?.created_at;
        const bCreatedAt = b.book?.created_at;
        
        // Handle missing created_at gracefully
        if (!aCreatedAt && !bCreatedAt) return 0;
        if (!aCreatedAt) return 1;  // Push items without created_at to end
        if (!bCreatedAt) return -1;
        
        // Newest books first
        return new Date(bCreatedAt).getTime() - new Date(aCreatedAt).getTime();
      });

      // Cache the fresh data for next visit
      cacheLibraryBooks(deduplicatedData as DailyPublishedWithBook[], user?.id || '');

      return deduplicatedData as DailyPublishedWithBook[];

    },
    // Uses global 7-day staleTime from App.tsx for instant loading
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnWindowFocus: false, // Don't refetch on focus
  });
};