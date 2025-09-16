import type { OpenGraphMetadata, SEOMetadata, OpenGraphImage } from '@/types/openGraph';

/**
 * Default site-wide OpenGraph configuration
 */
export const DEFAULT_SITE_CONFIG = {
  siteName: 'ABC Illustrations',
  description: 'Create beautiful digital illustrations with ABC Illustrations - a clean, intuitive drawing canvas app',
  type: 'website' as const,
  locale: 'en_US',
  twitter: {
    card: 'summary_large_image' as const,
    site: '@lovable_dev',
  },
  defaultImage: {
    url: 'https://lovable.dev/opengraph-image-p98pqg.png',
    width: 1200,
    height: 630,
    alt: 'ABC Illustrations - Digital Drawing Canvas',
  }
};

/**
 * Generate absolute URL for the current environment
 */
export function getAbsoluteUrl(path: string = ''): string {
  // In production, use the actual domain
  const baseUrl = window.location.origin;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
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
      width: 1200,
      height: 630,
      alt: alt || DEFAULT_SITE_CONFIG.defaultImage.alt,
      type: 'image/png'
    };
  }
  
  return DEFAULT_SITE_CONFIG.defaultImage;
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
    title: title || DEFAULT_SITE_CONFIG.siteName,
    description: description || DEFAULT_SITE_CONFIG.description,
    type: DEFAULT_SITE_CONFIG.type,
    url: path ? generateCanonicalUrl(path) : undefined,
    image: DEFAULT_SITE_CONFIG.defaultImage,
    siteName: DEFAULT_SITE_CONFIG.siteName,
    locale: DEFAULT_SITE_CONFIG.locale,
    twitter: {
      ...DEFAULT_SITE_CONFIG.twitter,
      title: title,
      description: description,
      image: DEFAULT_SITE_CONFIG.defaultImage.url,
      imageAlt: DEFAULT_SITE_CONFIG.defaultImage.alt,
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
  const title = `${bookTitle} | ${DEFAULT_SITE_CONFIG.siteName}`;
  const description = bookDescription || `Explore "${bookTitle}" - an illustrated story created with ABC Illustrations`;
  const path = bookId ? `/books/${bookId}` : undefined;
  
  return {
    title,
    description,
    type: 'book',
    url: path ? generateCanonicalUrl(path) : undefined,
    image: createOpenGraphImage(coverImage, `Cover of ${bookTitle}`),
    siteName: DEFAULT_SITE_CONFIG.siteName,
    locale: DEFAULT_SITE_CONFIG.locale,
    twitter: {
      ...DEFAULT_SITE_CONFIG.twitter,
      title,
      description,
      image: createOpenGraphImage(coverImage, `Cover of ${bookTitle}`).url,
      imageAlt: `Cover of ${bookTitle}`,
    }
  };
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
  timeRemaining?: string
): SEOMetadata {
  const pageInfo = currentPage && totalPages ? ` (Page ${currentPage}/${totalPages})` : '';
  const title = `${contentTitle}${pageInfo} | Daily Illustrations`;
  
  let description = contentDescription || `Experience "${contentTitle}" - today's featured illustrated content`;
  if (timeRemaining) {
    description += ` • Available for ${timeRemaining}`;
  }
  
  const path = contentId ? `/daily-published/${contentId}` : undefined;
  
  return {
    title,
    description,
    type: 'article',
    url: path ? generateCanonicalUrl(path) : undefined,
    image: createOpenGraphImage(pageImage, `Illustration from ${contentTitle}`),
    siteName: DEFAULT_SITE_CONFIG.siteName,
    locale: DEFAULT_SITE_CONFIG.locale,
    publishedTime: new Date().toISOString(),
    twitter: {
      ...DEFAULT_SITE_CONFIG.twitter,
      title,
      description,
      image: createOpenGraphImage(pageImage, `Illustration from ${contentTitle}`).url,
      imageAlt: `Illustration from ${contentTitle}`,
    }
  };
}