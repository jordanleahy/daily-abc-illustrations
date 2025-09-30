import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Page {
  id: string;
  letter: string;
}

/**
 * Hook to prefetch and preload all page images for daily published content
 * Loads image metadata immediately and preloads critical images
 */
export function useDailyPublishedImagePreloader(pages: Page[] | undefined, bookId: string | undefined) {
  // Prefetch all image URLs in a single query
  const { data: imageUrls } = useQuery({
    queryKey: ['daily-published-images-batch', bookId, pages?.map(p => p.id)],
    queryFn: async () => {
      if (!pages || pages.length === 0) return [];
      
      const pageIds = pages.map(p => p.id);
      const { data, error } = await supabase
        .from('page_image_urls')
        .select('page_id, image_url')
        .in('page_id', pageIds)
        .eq('is_latest', true)
        .eq('generation_status', 'complete');
      
      if (error) {
        console.error('Error prefetching image URLs:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!pages && !!bookId && pages.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
  
  // Preload critical images (first 3) immediately
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0 || !pages) return;
    
    // Create a map for quick lookup
    const imageUrlMap = new Map(imageUrls.map(img => [img.page_id, img.image_url]));
    
    // Preload first 3 page images immediately
    const criticalPages = pages.slice(0, 3);
    criticalPages.forEach((page) => {
      const imageUrl = imageUrlMap.get(page.id);
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;
      }
    });
    
    // Preload remaining images with delay
    if (pages.length > 3) {
      const timeoutId = setTimeout(() => {
        const remainingPages = pages.slice(3);
        remainingPages.forEach((page) => {
          const imageUrl = imageUrlMap.get(page.id);
          if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
          }
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [imageUrls, pages]);
  
  return imageUrls;
}
