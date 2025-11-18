/**
 * Centralized site configuration
 * All site-wide constants and metadata should be defined here
 */

export const SITE_CONFIG = {
  // Basic site information
  name: 'ChairLift',
  tagline: 'Chairlift Habits',
  description: 'My daughter loves digital learning, so I build her a new book every day',
  subheading: 'Im a Jersey City parent who likes to play with AI and build interactive learning tools for my toddler.',
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
    alt: 'ChairLift - New books published daily at 7:01 AM Eastern Time',
  },
  
  // Content specific
  dailyContent: {
    title: 'ChairLift',
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