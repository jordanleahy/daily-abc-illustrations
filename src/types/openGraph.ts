/**
 * OpenGraph metadata types for social media sharing and SEO
 */

export interface OpenGraphImage {
  /** Public URL of the image */
  url: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Alt text for the image */
  alt?: string;
  /** Image MIME type */
  type?: string;
}

export interface OpenGraphMetadata {
  /** Page title for social sharing */
  title: string;
  /** Page description for social sharing */
  description: string;
  /** OpenGraph type (website, article, etc.) */
  type?: 'website' | 'article' | 'book' | 'profile';
  /** Canonical URL of the page */
  url?: string;
  /** Primary image for social sharing */
  image?: OpenGraphImage;
  /** Site name */
  siteName?: string;
  /** Locale (e.g., en_US) */
  locale?: string;
}

export interface TwitterCardMetadata {
  /** Twitter card type */
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  /** Twitter site handle */
  site?: string;
  /** Twitter creator handle */
  creator?: string;
  /** Title for Twitter card */
  title?: string;
  /** Description for Twitter card */
  description?: string;
  /** Image for Twitter card */
  image?: string;
  /** Image alt text for Twitter */
  imageAlt?: string;
}

export interface SEOMetadata extends OpenGraphMetadata {
  /** Twitter card metadata */
  twitter?: TwitterCardMetadata;
  /** Additional meta keywords */
  keywords?: string[];
  /** Author information */
  author?: string;
  /** Published date (ISO string) */
  publishedTime?: string;
  /** Modified date (ISO string) */
  modifiedTime?: string;
}