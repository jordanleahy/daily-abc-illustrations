import { CharacterThemeValue } from './characterTheme';
import { AgeRangeId } from './ageRange';

/**
 * Library book type for decoupled library architecture
 * Separates library books from daily publishing system
 */
export interface LibraryBook {
  id: string;
  book_name: string;
  book_description?: string | null;
  created_at: string;
  updated_at: string;
  is_highlighted: boolean;
  total_pages: number;
  cover_image?: string | null;
  // User activity fields
  last_viewed_at?: string | null;
  view_count?: number;
  completion_count?: number; // Number of times this book was completed by family kids
  // Book categorization metadata
  metadata?: {
    type?: string;
    bookType?: string;
    targetAge?: AgeRangeId;
    characterTheme?: CharacterThemeValue;
  } | null;
}
