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
  thumbnail_url?: string | null;
  is_highlighted: boolean;
  total_pages: number;
  cover_image?: string | null;
  // User activity fields
  last_viewed_at?: string | null;
  view_count?: number;
}
