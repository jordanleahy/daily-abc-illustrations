import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LandingPageImage {
  id: string;
  letter: string;
  page_number: number;
  title: string;
  description: string;
  image_url: string | null;
}

export interface LandingDailyPublished {
  id: string;
  book_id: string;
  title: string;
  description: string;
  status: string;
  is_active: boolean;
  expires_at: string;
  pages: LandingPageImage[];
}

export interface LandingPopularBook {
  id: string;
  book_name: string;
  book_description: string;
  status: string;
  is_highlighted: boolean;
  image_url: string | null;
  metadata?: {
    bookType?: string;
    targetAge?: string;
  };
}

export interface LandingLibraryBook {
  id: string;
  book_id: string;
  title: string;
  description: string;
  status: string;
  is_active: boolean;
  published_at: string;
  slug?: string | null;
  og_image_url: string | null;
  seo_title?: string | null;
  metadata?: {
    bookType?: string;
    targetAge?: string;
  };
}

export interface LandingPageData {
  dailyPublished: LandingDailyPublished | null;
  popularBooks: LandingPopularBook[];
  libraryBooks: LandingLibraryBook[];
}

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
