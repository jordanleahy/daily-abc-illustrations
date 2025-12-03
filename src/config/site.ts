/**
 * Centralized site configuration
 * All site-wide constants and metadata should be defined here
 */

export const SITE_CONFIG = {
  // Basic site information
  name: 'Chairlift Habits',
  tagline: 'The gift that grows with your grandchildren',
  description: 'Stay connected through daily personalized books designed just for your grandchild',
  subheading: 'where habits are developed and curiosity cultures educational moments',
  author: 'Lovable',
  
  // URLs and social
  url: typeof window !== 'undefined' ? window.location.origin : '',
  productionUrl: 'https://dailyabcillustrations.com',
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
    alt: 'Chairlift Habits - New books published daily at 7:01 AM Eastern Time',
  },
  
  // Content specific
  dailyContent: {
    title: 'Chairlift Habits',
    description: 'New books published daily at 7:01 AM Eastern Time',
    schedule: '7:01 AM Eastern Time daily',
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