import { useMemo } from 'react';
import { useDailyPublishedById } from './useDailyPublishedById';
import { useDailyPublishedPages } from './useDailyPublishedPages';
import { usePublicPageImage } from './usePublicPageImage';
import { usePublicBook } from './usePublicBook';
import { useBookSeoMetadata } from './useBookSeoMetadata';
import { generateDailyPublishedOpenGraph } from '@/utils/openGraph';
import { formatTimeRemaining } from '@/utils/timeUtils';
import type { SEOMetadata } from '@/types/openGraph';

/**
 * 🚀 BEGINNER'S GUIDE TO OPENGRAPH METADATA 🚀
 * 
 * What is OpenGraph? 
 * OpenGraph is a protocol that allows web pages to become rich objects in social graphs.
 * In simple terms: when you share a link on Facebook, Twitter, etc., OpenGraph determines
 * what title, description, and image are shown in the preview card.
 * 
 * What does this hook do?
 * This custom React hook generates OpenGraph metadata for daily published content.
 * It fetches data from multiple sources and combines them into a single metadata object
 * that can be used to set HTML meta tags for social media sharing.
 * 
 * Why is this complex?
 * We need to fetch data from multiple tables (daily_published, pages, books, seo_metadata)
 * and handle loading states, fallbacks, and auto-generation of SEO content.
 */

/**
 * Custom hook to generate OpenGraph metadata for daily published content
 * 
 * @param dailyId - The unique identifier for the daily published content
 * @param currentPageIndex - The current page being viewed (0-based index)
 * @returns Object containing OpenGraph metadata and loading states
 * 
 * 📚 LEARNING NOTE:
 * Custom hooks are JavaScript functions that:
 * 1. Start with "use" (React convention)
 * 2. Can call other hooks
 * 3. Allow you to reuse stateful logic between components
 * 4. Return data and functions that components can use
 */
export const useDailyPublishedOpenGraph = (
  dailyId: string | undefined,
  currentPageIndex: number = 0
) => {
  /**
   * 🔍 DATA FETCHING PHASE
   * 
   * We use multiple custom hooks to fetch different pieces of data.
   * Each hook manages its own loading state and caching using React Query.
   * 
   * 📚 LEARNING NOTE - React Query:
   * React Query automatically handles caching, background updates, and loading states.
   * When we call these hooks, they might return cached data immediately or 
   * trigger a network request if the data is stale.
   */

  // Fetch the main daily published content (title, description, expiry date, etc.)
  const { data: dailyResult } = useDailyPublishedById(dailyId);
  const dailyContent = dailyResult?.data;
  
  // Fetch all pages that belong to this book
  // 📚 LEARNING NOTE - Conditional fetching:
  // The pages hook only runs if we have a book_id from the daily content
  const { data: pages = [] } = useDailyPublishedPages(dailyContent?.book_id);
  
  // Fetch book details for additional metadata (category, description, etc.)
  const { data: book } = usePublicBook(dailyContent?.book_id);
  
  /**
   * 📄 PAGE MANAGEMENT
   * 
   * We need to track both the current page (for navigation) and the first page
   * (for consistent OpenGraph images across all social media shares)
   */
  
  // Get current page that the user is viewing
  const currentPage = pages[currentPageIndex];
  
  // Always use first page for OpenGraph image to maintain consistency
  // When someone shares page 5, we still want to show the book's main image
  const firstPage = pages[0];
  
  // Fetch the image for the first page
  // 📚 LEARNING NOTE - Optional chaining:
  // firstPage?.id means "if firstPage exists, get its id, otherwise use undefined"
  const { data: firstPageImage } = usePublicPageImage(firstPage?.id);

  /**
   * 🎯 SEO METADATA STRATEGY (Simplified)
   * 
   * ✅ Phase 0.5 Cleanup: Removed daily-specific SEO system
   * Now we only use book-level SEO metadata for all publications
   * 
   * 📚 LEARNING NOTE:
   * This is simpler and more maintainable - one SEO record per book
   * rather than duplicate SEO for each publication.
   */

  // Get book-level SEO metadata using the book_id
  const { data: bookSeoMetadata, isLoading: isLoadingBookSeo } = useBookSeoMetadata(
    dailyContent?.book_id
  );
  
  // Use book SEO metadata directly
  const finalSeoMetadata = bookSeoMetadata;
  
  // Extract the optimized titles and descriptions for social sharing
  const optimizedTitle = finalSeoMetadata?.seo_title;
  const optimizedDescription = finalSeoMetadata?.seo_description;
  
  // Boolean flags to track SEO status
  const hasOptimizedContent = !!(optimizedTitle && optimizedDescription);
  const isOptimizing = isLoadingBookSeo;

  /**
   * 🎨 OPENGRAPH METADATA GENERATION
   * 
   * This is where all our fetched data comes together to create the final
   * OpenGraph metadata object that will be used for social media sharing.
   * 
   * 📚 LEARNING NOTE - useMemo:
   * useMemo is a React hook that memoizes (caches) expensive computations.
   * It only recalculates when its dependencies change, preventing unnecessary
   * work on every render. Perfect for complex data transformations like this!
   */
  const openGraphMetadata: SEOMetadata | null = useMemo(() => {
    console.log('🔄 [DEBUG] useDailyPublishedOpenGraph: Generating metadata for:', {
      dailyId,
      dailyTitle: dailyContent?.title,
      hasPages: pages.length > 0,
      currentPageIndex,
      hasSeoMetadata: !!finalSeoMetadata,
      optimizedTitle,
      optimizedDescription,
      ogImageUrl: finalSeoMetadata?.og_image_url,
      firstPageImageUrl: firstPageImage?.image_url
    });

    // Early return: we need basic data before we can generate metadata
    if (!dailyContent || !pages.length) {
      console.log('⚠️ [DEBUG] useDailyPublishedOpenGraph: Missing basic data:', {
        hasDailyContent: !!dailyContent,
        pagesCount: pages.length
      });
      return null;
    }

    // Wait for image loading: don't generate metadata until we know if there's an image
    // 📚 LEARNING NOTE - Loading state management:
    // We wait for firstPageImage to be either loaded (with data) or confirmed as null
    // undefined means it's still loading
    if (firstPage?.id && firstPageImage === undefined) {
      console.log('⏳ [DEBUG] useDailyPublishedOpenGraph: Waiting for first page image to load');
      return null;
    }

    // Calculate values needed for the OpenGraph metadata
    const timeRemaining = formatTimeRemaining(dailyContent.expires_at);
    const pageNumber = currentPageIndex + 1; // Convert from 0-based to 1-based
    const totalPages = pages.length;
    
    // Prioritize SEO metadata image, fallback to first page image for consistent OpenGraph sharing
    const ogImage = finalSeoMetadata?.og_image_url || firstPageImage?.image_url || null;

    console.log('📋 [DEBUG] useDailyPublishedOpenGraph: About to generate OpenGraph with:', {
      title: dailyContent.title,
      description: dailyContent.description,
      pageNumber,
      totalPages,
      dailyId: dailyContent.id,
      ogImage,
      timeRemaining,
      optimizedTitle,
      optimizedDescription
    });

    // Call the utility function to generate the complete metadata object
    // This function handles all the OpenGraph protocol requirements
    const result = generateDailyPublishedOpenGraph(
      dailyContent.title,           // Main content title
      dailyContent.description,     // Main content description  
      pageNumber,                   // Current page (1, 2, 3...)
      totalPages,                   // Total number of pages
      dailyContent.id,              // Unique identifier for URLs
      ogImage,                      // Image URL for social sharing
      timeRemaining,                // "Expires in X hours" text
      optimizedTitle,               // AI-optimized title (if available)
      optimizedDescription          // AI-optimized description (if available)
    );

    console.log('✅ [DEBUG] useDailyPublishedOpenGraph: Generated result:', result);
    return result;
    
    // 📚 LEARNING NOTE - Dependency array:
    // useMemo re-runs when any value in this array changes
  }, [dailyContent, pages, currentPageIndex, firstPageImage, optimizedTitle, optimizedDescription]);

  /**
   * 📦 RETURN OBJECT
   * 
   * This hook returns an object with everything a component needs
   * to handle OpenGraph metadata and loading states.
   */
  return {
    // The complete OpenGraph metadata object (or null if not ready)
    openGraphMetadata,
    
    // Boolean: true when we have all required data loaded
    isReady: !!dailyContent && pages.length > 0,
    
    // Boolean: true when SEO metadata is being loaded or generated
    isOptimizing,
    
    // Boolean: true when we have AI-optimized title and description
    hasOptimizedContent
  };
};