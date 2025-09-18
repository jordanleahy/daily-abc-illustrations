import { useMemo, useState, useEffect } from 'react';
import { useDailyPublishedById } from './useDailyPublishedById';
import { useDailyPublishedPages } from './useDailyPublishedPages';
import { usePublicPageImage } from './usePublicPageImage';
import { usePublicBook } from './usePublicBook';
import { useSeoMetadata, useSeoMetadataByBook } from './useSeoMetadata';
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
  const { data: book } = usePublicBook(dailyContent?.book_id);
  
  // Get current page
  const currentPage = pages[currentPageIndex];
  
  // Get first page for consistent OpenGraph image (always use first page for social sharing)
  const firstPage = pages[0];
  
  // Fetch image for the first page using public hook
  const { data: firstPageImage } = usePublicPageImage(firstPage?.id || '');

  // Fetch SEO metadata from database - try daily published first, then fallback to book-level
  const { data: seoMetadata, isLoading: isLoadingSeo } = useSeoMetadata(dailyId);
  
  // If no daily-specific SEO data, check for book-level SEO data
  const { data: bookSeoMetadata, isLoading: isLoadingBookSeo } = useSeoMetadataByBook(
    dailyContent?.book_id && !seoMetadata ? dailyContent.book_id : undefined
  );
  
  // Auto-generate daily-specific SEO if needed
  useEffect(() => {
    const generateDailySEO = async () => {
      if (!dailyContent || !dailyId || seoMetadata || isLoadingSeo) return;
      
      // Only generate if we have book-level SEO but no daily-specific SEO
      if (bookSeoMetadata && !isLoadingBookSeo) {
        try {
          console.log('Auto-generating daily-specific SEO for:', dailyId);
          const timeRemaining = formatTimeRemaining(dailyContent.expires_at);
          
          await supabase.functions.invoke('update-seo-for-daily-published', {
            body: {
              dailyPublishedId: dailyId,
              bookId: dailyContent.book_id,
              contentTitle: dailyContent.title,
              timeRemaining
            }
          });
        } catch (error) {
          console.error('Failed to generate daily SEO:', error);
        }
      }
    };

    generateDailySEO();
  }, [dailyContent, dailyId, seoMetadata, isLoadingSeo, bookSeoMetadata, isLoadingBookSeo]);
  
  // Use daily-specific SEO if available, otherwise use book-level SEO
  const finalSeoMetadata = seoMetadata || bookSeoMetadata;
  
  // Extract optimized content from SEO metadata
  const optimizedTitle = finalSeoMetadata?.seo_title;
  const optimizedDescription = finalSeoMetadata?.seo_description;
  const hasOptimizedContent = !!(optimizedTitle && optimizedDescription);
  const isOptimizing = isLoadingSeo || isLoadingBookSeo;

  // Generate OpenGraph metadata
  const openGraphMetadata: SEOMetadata | null = useMemo(() => {
    if (!dailyContent || !pages.length) {
      return null;
    }

    // Don't generate metadata until we have the first page image loaded or confirmed it doesn't exist
    if (firstPage?.id && firstPageImage === undefined) {
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
      optimizedTitle,
      optimizedDescription
    );
  }, [dailyContent, pages, currentPageIndex, firstPageImage, optimizedTitle, optimizedDescription]);

  return {
    openGraphMetadata,
    isReady: !!dailyContent && pages.length > 0,
    isOptimizing,
    hasOptimizedContent
  };
};