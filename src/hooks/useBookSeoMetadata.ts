import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch SEO metadata for a book (not tied to daily published content)
 * This will look for SEO metadata that was created specifically for this book
 */
export const useBookSeoMetadata = (bookId?: string) => {
  return useQuery({
    queryKey: ['book-seo-metadata', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      // Look for SEO metadata using the book-seo ID format or source_data search
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('is_latest', true)
        .eq('is_active', true)
        .eq('optimization_status', 'complete')
        .or(`daily_published_id.eq.book-seo-${bookId},source_data.cs.{"bookId":"${bookId}"}`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching book SEO metadata:', error);
        return null;
      }

      return data;
    },
    enabled: !!bookId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};