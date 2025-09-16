import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePageImageUrlsPublic = (pageId: string) => {
  return useQuery({
    queryKey: ['page-image-public', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      
      const { data, error } = await supabase
        .from('page_image_urls')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_latest', true)
        .eq('generation_status', 'complete')
        .maybeSingle();

      if (error) {
        console.error('Error fetching page image (public):', error);
        return null;
      }

      return data;
    },
    enabled: !!pageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};