import type { OpenGraphMetadata, SEOMetadata, OpenGraphImage } from '@/types/openGraph';
import { SITE_CONFIG, getAbsoluteUrl as getConfigAbsoluteUrl } from '@/config/site';
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate absolute URL for the current environment
 */
export function getAbsoluteUrl(path: string = ''): string {
  return getConfigAbsoluteUrl(path);
}

/**
 * Generate canonical URL for a page
 */
export function generateCanonicalUrl(path: string): string {
  return getAbsoluteUrl(path);
}

/**
 * Create OpenGraph image object with fallback
 */
export function createOpenGraphImage(
  imageUrl?: string | null,
  alt?: string
): OpenGraphImage {
  if (imageUrl && imageUrl.trim()) {
    return {
      url: imageUrl.startsWith('http') ? imageUrl : getAbsoluteUrl(imageUrl),
      width: SITE_CONFIG.defaultImage.width,
      height: SITE_CONFIG.defaultImage.height,
      alt: alt || SITE_CONFIG.defaultImage.alt,
      type: 'image/png'
    };
  }
  
  return SITE_CONFIG.defaultImage;
}

/**
 * Generate default OpenGraph metadata for any page
 */
export function generateDefaultOpenGraph(
  title?: string,
  description?: string,
  path?: string
): SEOMetadata {
  return {
    title: title || SITE_CONFIG.name,
    description: description || SITE_CONFIG.description,
    type: 'website',
    url: path ? generateCanonicalUrl(path) : undefined,
    image: SITE_CONFIG.defaultImage,
    siteName: SITE_CONFIG.name,
    locale: SITE_CONFIG.locale,
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter.handle,
      creator: SITE_CONFIG.twitter.creator,
      title: title,
      description: description,
      image: SITE_CONFIG.defaultImage.url,
      imageAlt: SITE_CONFIG.defaultImage.alt,
    }
  };
}

/**
 * Generate OpenGraph metadata for books
 */
export function generateBookOpenGraph(
  bookTitle: string,
  bookDescription?: string,
  bookId?: string,
  coverImage?: string
): SEOMetadata {
  const title = `${bookTitle} | ${SITE_CONFIG.name}`;
  const description = bookDescription || `Explore "${bookTitle}" - an illustrated story created with ${SITE_CONFIG.name}`;
  const path = bookId ? `/books/${bookId}` : undefined;
  
  return {
    title,
    description,
    type: 'book',
    url: path ? generateCanonicalUrl(path) : undefined,
    image: createOpenGraphImage(coverImage, `Cover of ${bookTitle}`),
    siteName: SITE_CONFIG.name,
    locale: SITE_CONFIG.locale,
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter.handle,
      creator: SITE_CONFIG.twitter.creator,
      title,
      description,
      image: createOpenGraphImage(coverImage, `Cover of ${bookTitle}`).url,
      imageAlt: `Cover of ${bookTitle}`,
    }
  };
}

/**
 * Optimize OpenGraph title and description using AI
 */
export async function optimizeOpenGraphContent(
  contentTitle: string,
  bookDescription?: string,
  category?: string,
  timeRemaining?: string,
  currentPage?: number,
  totalPages?: number
): Promise<{ optimizedTitle?: string; optimizedDescription?: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('optimize-opengraph', {
      body: {
        contentTitle,
        bookDescription,
        category,
        timeRemaining,
        currentPage,
        totalPages,
      },
    });

    if (error) {
      console.error('Error optimizing OpenGraph content:', error);
      return null;
    }

    return {
      optimizedTitle: data?.optimizedTitle,
      optimizedDescription: data?.optimizedDescription,
    };
  } catch (error) {
    console.error('Failed to optimize OpenGraph content:', error);
    return null;
  }
}

/**
 * Generate OpenGraph metadata for daily published content
 */
export function generateDailyPublishedOpenGraph(
  contentTitle: string,
  contentDescription?: string,
  currentPage?: number,
  totalPages?: number,
  contentId?: string,
  pageImage?: string,
  timeRemaining?: string,
  optimizedTitle?: string,
  optimizedDescription?: string
): SEOMetadata {
  // Use optimized title if available, otherwise create engaging title with pagination
  let title = optimizedTitle || contentTitle;
  
  // Add page info if we have multiple pages and no optimized title
  if (!optimizedTitle && currentPage && totalPages && totalPages > 1) {
    title = `${contentTitle} (Page ${currentPage}/${totalPages})`;
  }
  
  // Add site branding if not using optimized title
  if (!optimizedTitle) {
    title = `${title} | ${SITE_CONFIG.dailyContent.title}`;
  }
  
  // Use optimized description if available, otherwise create compelling description
  let description = optimizedDescription || contentDescription || `Experience "${contentTitle}" - today's featured illustrated content`;
  
  // Add urgency if time-limited and no optimized description
  if (!optimizedDescription && timeRemaining) {
    description = `${description} • Available for ${timeRemaining}`;
  }
  
  const path = contentId ? `/daily-published/${contentId}` : undefined;
  
  return {
    title,
    description,
    type: 'article',
    url: path ? generateCanonicalUrl(path) : undefined,
    image: createOpenGraphImage(pageImage, `Illustration from ${contentTitle}`),
    siteName: SITE_CONFIG.name,
    locale: SITE_CONFIG.locale,
    publishedTime: new Date().toISOString(),
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter.handle,
      creator: SITE_CONFIG.twitter.creator,
      title,
      description,
      image: createOpenGraphImage(pageImage, `Illustration from ${contentTitle}`).url,
      imageAlt: `Illustration from ${contentTitle}`,
    }
  };
}