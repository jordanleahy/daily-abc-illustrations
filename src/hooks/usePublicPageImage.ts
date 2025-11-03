import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageImageUrl } from '@/types/pageImageUrl';

export const usePublicPageImage = (pageId?: string) => {
  const query = useQuery({
    queryKey: ['public-page-image', pageId],
    queryFn: async () => {
      if (!pageId) return null;
      const { data, error } = await supabase
        .from('page_image_urls')
        .select('image_url')
        .eq('page_id', pageId)
        .eq('is_latest', true)
        .not('image_url', 'is', null)
        .maybeSingle();

      if (error) {
        console.error('Error fetching public page image:', error);
        throw error;
      }

      return data as PageImageUrl | null;
    },
    enabled: !!pageId,
    staleTime: 60 * 60 * 1000, // 1 hour - aggressive caching
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });

  // Preload the image as soon as the URL is available
  useEffect(() => {
    if (query.data?.image_url) {
      const img = new Image();
      img.src = query.data.image_url;
    }
  }, [query.data?.image_url]);

  return query;
};