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
  
  // Fetch image for the current page (for OpenGraph image)
  const { currentImage } = usePageImageUrls(currentPage?.id);

  // Generate OpenGraph metadata
  const openGraphMetadata: SEOMetadata | null = useMemo(() => {
    if (!dailyContent || !pages.length) {
      return null;
    }

    const timeRemaining = formatTimeRemaining(dailyContent.expires_at);
    const pageNumber = currentPageIndex + 1;
    const totalPages = pages.length;
    
    // Use current page image, or fallback to first page if we don't have current page image
    const ogImage = currentImage?.image_url || null;

    return generateDailyPublishedOpenGraph(
      dailyContent.title,
      dailyContent.description,
      pageNumber,
      totalPages,
      dailyContent.id,
      ogImage,
      timeRemaining
    );
  }, [dailyContent, pages, currentPageIndex, currentImage]);

  return {
    openGraphMetadata,
    isReady: !!dailyContent && pages.length > 0
  };
};