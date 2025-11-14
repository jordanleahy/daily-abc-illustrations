import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Page {
  id: string;
  letter: string;
}

interface PageImage {
  page_id: string;
  letter: string;
  page_number: number;
  image_url: string;
}

/**
 * Hook to prefetch and preload all page images for daily published content
 * Accepts pre-fetched images to avoid additional queries
 */
export function useDailyPublishedImagePreloader(
  pages: Page[] | undefined, 
  bookId: string | undefined,
  pageImagesMap?: Record<number, string>
) {
  // Use provided images if available (from joined query), otherwise fetch via edge function
  const shouldFetch = !!bookId && !pageImagesMap;
  
  // Prefetch all image URLs using optimized edge function (only if not provided)
  const { data: imageUrls } = useQuery<PageImage[]>({
    queryKey: ['daily-published-images-batch', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      
      try {
        const { data, error } = await supabase.functions.invoke<{ images: PageImage[] }>('get-daily-published-images', {
          body: { bookId }
        });
        
        if (error) {
          console.error('Error fetching images from edge function:', error);
          return [];
        }
        
        return data?.images || [];
      } catch (error) {
        console.error('Error in image preloader:', error);
        return [];
      }
    },
    enabled: shouldFetch,
    // Uses global 7-day staleTime from App.tsx for instant loading
  });
  
  // Progressive batch image preloading with Supabase transformations
  useEffect(() => {
    if (!pages) return;
    
    // Use provided images map or fetch from query
    let imageUrlMap: Map<string, string>;
    
    if (pageImagesMap) {
      // Convert Record<number, string> to Map<page_id, image_url>
      imageUrlMap = new Map();
      pages.forEach((page: any) => {
        const imageUrl = pageImagesMap[page.page_number];
        if (imageUrl) {
          imageUrlMap.set(page.id, imageUrl);
        }
      });
    } else if (imageUrls && imageUrls.length > 0) {
      // Use fetched images
      imageUrlMap = new Map(imageUrls.map(img => [img.page_id, img.image_url]));
    } else {
      return;
    }
    
    // Helper to add Supabase image transformations
    const optimizeImageUrl = (url: string): string => {
      if (!url.includes('supabase.co/storage')) return url;
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=800&quality=80&format=webp`;
    };
    
    const timeouts: NodeJS.Timeout[] = [];
    
    // Batch 1: First 5 images immediately (critical)
    const batch1 = pages.slice(0, 5);
    batch1.forEach((page) => {
      const imageUrl = imageUrlMap.get(page.id);
      if (imageUrl) {
        const img = new Image();
        img.src = optimizeImageUrl(imageUrl);
      }
    });
    
    // Batch 2: Next 5 images after 100ms
    if (pages.length > 5) {
      timeouts.push(setTimeout(() => {
        const batch2 = pages.slice(5, 10);
        batch2.forEach((page) => {
          const imageUrl = imageUrlMap.get(page.id);
          if (imageUrl) {
            const img = new Image();
            img.src = optimizeImageUrl(imageUrl);
          }
        });
      }, 100));
    }
    
    // Batch 3: Next 5 images after 250ms
    if (pages.length > 10) {
      timeouts.push(setTimeout(() => {
        const batch3 = pages.slice(10, 15);
        batch3.forEach((page) => {
          const imageUrl = imageUrlMap.get(page.id);
          if (imageUrl) {
            const img = new Image();
            img.src = optimizeImageUrl(imageUrl);
          }
        });
      }, 250));
    }
    
    // Batch 4: Remaining images after 500ms
    if (pages.length > 15) {
      timeouts.push(setTimeout(() => {
        const batch4 = pages.slice(15);
        batch4.forEach((page) => {
          const imageUrl = imageUrlMap.get(page.id);
          if (imageUrl) {
            const img = new Image();
            img.src = optimizeImageUrl(imageUrl);
          }
        });
      }, 500));
    }
    
    return () => timeouts.forEach(clearTimeout);
  }, [imageUrls, pages, pageImagesMap]);
  
  return imageUrls;
}
