import { useMemo, useState, useEffect } from 'react';
import { useDailyPublishedById } from './useDailyPublishedById';
import { useDailyPublishedPages } from './useDailyPublishedPages';
import { usePageImageUrls } from './usePageImageUrls';
import { useBook } from './useBook';
import { generateDailyPublishedOpenGraph, optimizeOpenGraphContent } from '@/utils/openGraph';
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
  
  // Fetch book details for category/description
  const { data: book } = useBook(dailyContent?.book_id);
  
  // Get current page
  const currentPage = pages[currentPageIndex];
  
  // Get first page for consistent OpenGraph image (always use first page for social sharing)
  const firstPage = pages[0];
  
  // Fetch image for the first page (for OpenGraph image)
  const { currentImage: firstPageImage } = usePageImageUrls(firstPage?.id);

  // State for AI optimization
  const [optimizedContent, setOptimizedContent] = useState<{
    optimizedTitle?: string;
    optimizedDescription?: string;
  } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Optimize content when dependencies change
  useEffect(() => {
    if (!dailyContent || !pages.length) return;

    const optimizeContent = async () => {
      setIsOptimizing(true);
      try {
        const timeRemaining = formatTimeRemaining(dailyContent.expires_at);
        const pageNumber = currentPageIndex + 1;
        const totalPages = pages.length;

        const result = await optimizeOpenGraphContent(
          dailyContent.title,
          book?.book_description || dailyContent.description,
          book?.book_name || 'Educational Content', // Use book name as category
          timeRemaining,
          pageNumber,
          totalPages
        );

        setOptimizedContent(result);
      } catch (error) {
        console.error('Failed to optimize OpenGraph content:', error);
        setOptimizedContent(null);
      } finally {
        setIsOptimizing(false);
      }
    };

    optimizeContent();
  }, [dailyContent?.id, dailyContent?.title, dailyContent?.description, book?.book_name, book?.book_description, currentPageIndex, pages.length]);

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
      timeRemaining,
      optimizedContent?.optimizedTitle,
      optimizedContent?.optimizedDescription
    );
  }, [dailyContent, pages, currentPageIndex, firstPageImage, optimizedContent]);

  return {
    openGraphMetadata,
    isReady: !!dailyContent && pages.length > 0,
    isOptimizing,
    hasOptimizedContent: !!optimizedContent?.optimizedTitle || !!optimizedContent?.optimizedDescription
  };
};