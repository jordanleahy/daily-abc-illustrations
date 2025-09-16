import { useMemo } from 'react';
import { useDailyPublishedById } from './useDailyPublishedById';
import { useDailyPublishedPages } from './useDailyPublishedPages';
import { usePageImageUrls } from './usePageImageUrls';
import { generateDailyPublishedOpenGraph } from '@/utils/openGraph';
import { formatTimeRemaining } from '@/utils/timeUtils';
import type { SEOMetadata } from '@/types/openGraph';

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
  
  // Get current page
  const currentPage = pages[currentPageIndex];
  
  // Get first page for consistent OpenGraph image (always use first page for social sharing)
  const firstPage = pages[0];
  
  // Fetch image for the first page (for OpenGraph image)
  const { currentImage: firstPageImage } = usePageImageUrls(firstPage?.id);

  // Generate OpenGraph metadata
  const openGraphMetadata: SEOMetadata | null = useMemo(() => {
    if (!dailyContent || !pages.length) {
      return null;
    }

    const timeRemaining = formatTimeRemaining(dailyContent.expires_at);
    const pageNumber = currentPageIndex + 1;
    const totalPages = pages.length;
    
    // Use first page image for consistent OpenGraph sharing
    const ogImage = firstPageImage?.image_url || null;

    return generateDailyPublishedOpenGraph(
      dailyContent.title,
      dailyContent.description,
      pageNumber,
      totalPages,
      dailyContent.id,
      ogImage,
      timeRemaining
    );
  }, [dailyContent, pages, currentPageIndex, firstPageImage]);

  return {
    openGraphMetadata,
    isReady: !!dailyContent && pages.length > 0
  };
};