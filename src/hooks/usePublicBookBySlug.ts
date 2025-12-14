import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResolvedPublicBook } from '@/types/dailyPublished';

export const usePublicBookBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['public-book-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .rpc('resolve_public_book_by_slug', { p_slug: slug });

      if (error) {
        console.error('Error resolving public book by slug:', error);
        throw error;
      }

      // RPC returns an array, get first result
      const result = Array.isArray(data) ? data[0] : data;
      return result as ResolvedPublicBook | null;
    },
    enabled: !!slug,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
