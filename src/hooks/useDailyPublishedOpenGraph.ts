import { useMemo, useState, useEffect } from 'react';
import { useDailyPublishedById } from './useDailyPublishedById';
import { useDailyPublishedPages } from './useDailyPublishedPages';
import { usePageImageUrls } from './usePageImageUrls';
import { useBook } from './useBook';
import { useSeoMetadata } from './useSeoMetadata';
import { generateDailyPublishedOpenGraph } from '@/utils/openGraph';
import { formatTimeRemaining } from '@/utils/timeUtils';
import type { SEOMetadata } from '@/types/openGraph';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate OpenGraph metadata for daily published content
 */
export const useDailyPublishedOpenGraph = (
  dailyId: string | undefined,
  currentPageIndex: number = 0
) => {
  // Fetch daily published content
  const { data: dailyContent } = useDailyPublishedById(dailyId);
  
  // Fetch pages for the book
  const { data: pages = [] } = useDailyPublishedPages(dailyContent?.book_id);
  
  // Fetch book details for category/description
  const { data: book } = useBook(dailyContent?.book_id);
  
  // Get current page
  const currentPage = pages[currentPageIndex];
  
  // Get first page for consistent OpenGraph image (always use first page for social sharing)
  const firstPage = pages[0];
  
  // State to hold the first page image URL directly from database
  const [firstPageImageUrl, setFirstPageImageUrl] = useState<string | null>(null);
  
  // Fetch first page image directly from database to ensure we get it
  useEffect(() => {
    if (!firstPage?.id) return;
    
    const fetchFirstPageImage = async () => {
      try {
        const { data, error } = await supabase
          .from('page_image_urls')
          .select('image_url')
          .eq('page_id', firstPage.id)
          .eq('is_latest', true)
          .eq('generation_status', 'complete')
          .single();
          
        if (error) {
          console.error('Error fetching first page image:', error);
          return;
        }
        
        console.log('[useDailyPublishedOpenGraph] First page image URL:', data?.image_url);
        setFirstPageImageUrl(data?.image_url || null);
      } catch (error) {
        console.error('Error in fetchFirstPageImage:', error);
      }
    };
    
    fetchFirstPageImage();
  }, [firstPage?.id]);
  
  // Fetch image for the first page (for OpenGraph image) - keep this as backup
  const { currentImage: firstPageImage } = usePageImageUrls(firstPage?.id);
  
  // Debug logging for OpenGraph image
  console.log('[useDailyPublishedOpenGraph] Debug info:', {
    firstPageId: firstPage?.id,
    firstPageTitle: firstPage?.title,
    hasFirstPageImage: !!firstPageImage,
    firstPageImageUrl: firstPageImage?.image_url,
    firstPageImageStatus: firstPageImage?.generation_status,
    directFetchedUrl: firstPageImageUrl
  });

  // Fetch SEO metadata from database
  const { data: seoMetadata, isLoading: isLoadingSeo } = useSeoMetadata(dailyId);
  
  // Extract optimized content from SEO metadata
  const optimizedTitle = seoMetadata?.seo_title;
  const optimizedDescription = seoMetadata?.seo_description;
  const hasOptimizedContent = !!(optimizedTitle && optimizedDescription);
  const isOptimizing = isLoadingSeo;

  // Generate OpenGraph metadata
  const openGraphMetadata: SEOMetadata | null = useMemo(() => {
    if (!dailyContent || !pages.length) {
      return null;
    }

    // Don't generate metadata until we have the first page image loaded or confirmed it doesn't exist
    if (firstPage?.id && !firstPageImage && firstPageImage !== null) {
      console.log('[useDailyPublishedOpenGraph] Waiting for first page image to load...');
      return null;
    }

    const timeRemaining = formatTimeRemaining(dailyContent.expires_at);
    const pageNumber = currentPageIndex + 1;
    const totalPages = pages.length;
    
    // Use first page image for consistent OpenGraph sharing - prefer direct fetch over hook
    const ogImage = firstPageImageUrl || firstPageImage?.image_url || null;
    
    console.log('[generateDailyPublishedOpenGraph] Image being used:', {
      firstPageImageUrl: firstPageImage?.image_url,
      ogImage,
      hasImage: !!ogImage
    });

    return generateDailyPublishedOpenGraph(
      dailyContent.title,
      dailyContent.description,
      pageNumber,
      totalPages,
      dailyContent.id,
      ogImage,
      timeRemaining,
      optimizedTitle,
      optimizedDescription
    );
  }, [dailyContent, pages, currentPageIndex, firstPageImage, optimizedTitle, optimizedDescription, firstPageImageUrl]);

  return {
    openGraphMetadata,
    isReady: !!dailyContent && pages.length > 0,
    isOptimizing,
    hasOptimizedContent
  };
};