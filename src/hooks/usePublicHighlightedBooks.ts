import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types/book';

/**
 * Hook to fetch all publicly highlighted books (from any user)
 * for display on the landing page
 */
export const usePublicHighlightedBooks = () => {
  return useQuery({
    queryKey: ['public-highlighted-books'],
    queryFn: async () => {
      console.log('🔍 Fetching public highlighted books for landing page');

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'published')
        .eq('is_highlighted', true)
        .order('updated_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('❌ Error fetching public highlighted books:', error);
        throw error;
      }

      console.log('✅ Found public highlighted books:', data?.length || 0);
      return (data || []) as Book[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
