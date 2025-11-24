import { CharacterThemeValue } from './characterTheme';
import { BookTypeId } from './bookType';
import { AgeRangeId } from './ageRange';

/**
 * Page type enum matching database enum
 */
export type PageType = 'cover' | 'educational' | 'content';

/**
 * Type guard to check if a page is a cover page
 */
export const isCoverPage = (page: Page): boolean => {
  return page.page_type === 'cover';
};

/**
 * Type guard to check if a page is an educational focus page
 */
export const isEducationalPage = (page: Page): boolean => {
  return page.page_type === 'educational';
};

/**
 * Type guard to check if a page is a content page
 */
export const isContentPage = (page: Page): boolean => {
  return page.page_type === 'content';
};

/**
 * Structured metadata for book filtering and sorting
 * Captured from user choices during book creation
 */
export interface BookMetadata {
  /** Type of book created (abc, numbers, shapes, animals, etc.) */
  bookType?: BookTypeId;
  /** Number of pages in the book */
  pageCount?: number;
  /** Target age group (e.g., '2-4', '4-6') */
  targetAge?: AgeRangeId;
  
  // ABC Book specific
  /** Letter case preference for alphabet books */
  letterCase?: 'lowercase' | 'uppercase' | 'both';
  
  // Numbers Book specific
  /** Number range for counting books */
  numberRange?: string;
  /** Counting style (simple, skip-counting, number-families) */
  countingStyle?: string;
  
  // Shapes Book specific
  /** Shape complexity level */
  shapeComplexity?: string;
  /** Theme for shapes (nature, everyday-objects) */
  shapeTheme?: string;
  
  // Animals Book specific
  /** Animal category (farm, zoo, ocean, pets, mixed) */
  animalCategory?: string;
  /** Focus area for animals (sounds, habitats, characteristics) */
  animalFocus?: string;
  
  // Sight Words Book specific
  /** Reading level for sight words */
  readingLevel?: string;
  
  // Universal
  /** Character or theme (standardized enum values) */
  characterTheme?: CharacterThemeValue;
  /** Flexible storage for future expansion */
  customOptions?: Record<string, any>;
}

/**
 * Core book entity representing an educational ABC book
 * Contains metadata and configuration for the entire book
 */
export interface Book {
  /** Unique identifier for the book */
  id: string;
  /** ID of the user who owns this book */
  user_id: string;
  /** Display name of the book */
  book_name: string;
  /** Educational category or subject area (e.g., "Animals", "Science") */
  category?: string;
  /** Detailed description of the book's content and educational goals */
  book_description?: string;
  /** AI-generated product description for marketing purposes */
  product_description?: string;
  /** Total number of pages in the book (variable based on book type: 26 for ABC, 10 for numbers, etc.) */
  total_pages: number;
  /** Publication status of the book */
  status: 'draft' | 'published' | 'archived';
  /** Daily published status (from daily_published table) */
  dailyPublishedStatus?: 'draft' | 'queued' | 'active' | 'expired';
  /** ID of the currently deployed system prompt for AI operations */
  current_system_prompt_id?: string;
  /** URL of the first created page image (if any) */
  firstPageImageUrl?: string;
  /** Whether the book is highlighted/featured on the landing page */
  is_highlighted?: boolean;
  /** Manual tags for organization and categorization */
  tags?: string[];
  /** Structured metadata for filtering and sorting */
  metadata?: BookMetadata;
  /** ISO timestamp when the book was created */
  created_at: string;
  /** ISO timestamp when the book was last modified */
  updated_at: string;
  /** ISO timestamp of last activity (view, edit, image generation) */
  last_activity_at?: string;
}

/**
 * Individual page within an ABC book
 * Each page represents one letter of the alphabet with educational content
 */
export interface Page {
  /** Unique identifier for the page */
  id: string;
  /** ID of the book this page belongs to */
  book_id: string;
  /** Type of page (cover, educational, content) */
  page_type: PageType;
  /** Letter for content pages (A-Z), or identifier for cover/educational */
  letter: string;
  /** Page identifier (e.g., "A" for ABC, "3" for Numbers, "Red" for Colors) */
  page_identifier: string;
  /** Sequential page number (1, 2, 3...) */
  page_number: number;
  /** Title or heading for the page */
  title: string;
  /** Optional detailed description of the page content */
  description?: string;
  /** Structured educational content for the page */
  content: {
    /** Primary concept or word being taught */
    mainConcept: string;
    /** Interesting fact related to the concept */
    funFact: string;
    /** Interactive activity or exercise for engagement */
    activity: string;
    /** CSS text overlay configuration for GoogleChat books */
    textOverlay?: {
      enabled: boolean;
      position: 'bottom-center';
      createdAt?: string;
      // text field REMOVED - use page.title instead (single source of truth)
    };
    /** Word-level metadata for educational analysis */
    words?: Array<{
      word: string;
      order: number;
      syllableCount?: number;
      syllableBreakdown?: string;
      partOfSpeech?: string;
      letters?: Array<{
        letter: string;
        position: number;
        isVowel: boolean;
        isConsonant: boolean;
      }>;
    }>;
  };
  /** ID of the currently deployed system prompt for this page */
  current_system_prompt_id?: string;
  /** ISO timestamp when the page was created */
  created_at: string;
  /** ISO timestamp when the page was last modified */
  updated_at: string;
}

/**
 * Book entity with its associated pages loaded
 * Used when displaying complete book details with all page content
 */
export interface BookWithPages extends Book {
  /** Array of all pages belonging to this book */
  pages: Page[];
}