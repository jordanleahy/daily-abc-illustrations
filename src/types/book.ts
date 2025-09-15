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
  /** Total number of pages in the book (typically 26 for A-Z) */
  total_pages: number;
  /** Whether the book has been published and is ready for use */
  is_published: boolean;
  /** ID of the currently deployed system prompt for AI operations */
  current_system_prompt_id?: string;
  /** ISO timestamp when the book was created */
  created_at: string;
  /** ISO timestamp when the book was last modified */
  updated_at: string;
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