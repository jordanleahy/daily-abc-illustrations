import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  LandingPageData,
  LandingDailyPublished,
  LandingPopularBook,
  LandingLibraryBook,
  LandingPageImage,
} from '@/types/book-extended';

// Re-export types for backward compatibility
// TODO: Remove these re-exports - import directly from @/types/book-extended
export type {
  LandingPageData,
  LandingDailyPublished,
  LandingPopularBook,
  LandingLibraryBook,
  LandingPageImage,
};

/**
 * Single optimized hook that fetches ALL landing page data in one request
 * Eliminates query waterfalls for instant image loading
 */
export const useLandingPageData = () => {
  return useQuery({
    queryKey: ['landing-page-data'],
    queryFn: async () => {
      console.log('🚀 Fetching all landing page data in single request');
      
      const { data, error } = await supabase.functions.invoke('get-landing-page-data', {
        method: 'GET'
      });

      if (error) {
        console.error('❌ Error fetching landing page data:', error);
        throw error;
      }

      console.log('✅ Landing page data received:', {
        dailyPublished: !!data.dailyPublished,
        popularBooksCount: data.popularBooks?.length || 0,
        libraryBooksCount: data.libraryBooks?.length || 0
      });

      return data as LandingPageData;
    },
    // Uses global 7-day staleTime from App.tsx for instant loading
  });
};
