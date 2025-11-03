/**
 * Extended book-related types for specific use cases
 * Built using composition with base Book interface
 */

import { Book } from './book';

/**
 * Book with SEO metadata for daily published content
 */
export interface BookWithSEO extends Book {
  og_image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

/**
 * Page image data for landing page display
 */
export interface LandingPageImage {
  id: string;
  letter: string;
  page_number: number;
  title: string;
  description: string;
  image_url: string | null;
}

/**
 * Daily published content for landing page
 */
export interface LandingDailyPublished {
  id: string;
  book_id: string;
  title: string;
  description: string;
  status: string;
  is_active: boolean;
  expires_at: string;
  pages: LandingPageImage[];
}

/**
 * Popular/highlighted book for landing page
 */
export interface LandingPopularBook {
  id: string;
  book_name: string;
  book_description: string;
  status: string;
  is_highlighted: boolean;
  image_url: string | null;
  metadata?: {
    bookType?: string;
    targetAge?: string;
  };
}

/**
 * Library book with publication metadata
 */
export interface LandingLibraryBook {
  id: string;
  book_id: string;
  title: string;
  description: string;
  status: string;
  is_active: boolean;
  published_at: string;
  slug?: string | null;
  og_image_url: string | null;
  seo_title?: string | null;
  metadata?: {
    bookType?: string;
    targetAge?: string;
  };
}

/**
 * Complete landing page data bundle
 */
export interface LandingPageData {
  dailyPublished: LandingDailyPublished | null;
  popularBooks: LandingPopularBook[];
  libraryBooks: LandingLibraryBook[];
}

/**
 * Book with system prompt metadata
 */
export interface BookWithSystemPrompt extends Book {
  system_prompt?: {
    id: string;
    content: string;
    version_number: number;
    is_deployed: boolean;
    is_latest: boolean;
  };
}
