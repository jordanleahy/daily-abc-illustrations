/**
 * Centralized site configuration
 * All site-wide constants and metadata should be defined here
 */

export const SITE_CONFIG = {
  // Basic site information
  name: 'ABC Illustrations',
  tagline: 'Digital Drawing Canvas',
  description: 'Create beautiful digital illustrations with ABC Illustrations - a clean, intuitive drawing canvas app',
  author: 'Lovable',
  
  // URLs and social
  url: typeof window !== 'undefined' ? window.location.origin : '',
  twitter: {
    handle: '@lovable_dev',
    creator: '@lovable_dev',
  },
  
  // SEO and OpenGraph
  locale: 'en_US',
  defaultImage: {
    url: 'https://lovable.dev/opengraph-image-p98pqg.png',
    width: 1200,
    height: 630,
    alt: 'ABC Illustrations - Digital Drawing Canvas',
  },
  
  // Content specific
  dailyContent: {
    title: 'Daily ABC Illustrations',
    description: 'Daily featured illustrated content',
    expirationHours: 24,
  },
  
  // Branding
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
  }
} as const;

/**
 * Get the full site title (name + tagline)
 */
export function getFullSiteTitle(): string {
  return `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`;
}

/**
 * Get site title with optional page title
 */
export function getSiteTitle(pageTitle?: string): string {
  if (pageTitle) {
    return `${pageTitle} | ${SITE_CONFIG.name}`;
  }
  return getFullSiteTitle();
}

/**
 * Get absolute URL for the current environment
 */
export function getAbsoluteUrl(path: string = ''): string {
  const baseUrl = SITE_CONFIG.url || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}