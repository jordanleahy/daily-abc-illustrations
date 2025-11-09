/**
 * Structured metadata for book filtering and sorting
 * Captured from user choices during book creation
 */
export interface BookMetadata {
  /** Type of book created (abc, numbers, shapes, animals, etc.) */
  bookType?: string;
  /** Number of pages in the book */
  pageCount?: number;
  /** Target age group (toddler, preschool, early-reader) */
  targetAge?: string;
  
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
  /** Character or theme (paw-patrol, dinosaurs, space, etc.) */
  characterTheme?: string;
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
  /** Single letter this page represents (A-Z) */
  letter: string;
  /** Sequential page number (1-26) */
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
      text: string;
      position: 'bottom-center';
      createdAt?: string;
    };
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