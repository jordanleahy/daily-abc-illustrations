import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a URL-friendly slug from a book name.
 * Uses the book name (not SEO title) for consistency between URLs and database.
 */
export const generateSlugFromBookName = (bookName: string): string => {
  if (!bookName) return 'untitled';
  
  let slug = bookName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/-+/g, '-')            // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, '');       // Remove leading/trailing hyphens
  
  // Truncate to 60 characters
  slug = slug.substring(0, 60);
  
  // Remove trailing hyphen after truncation
  slug = slug.replace(/-+$/, '');
  
  return slug || 'untitled';
};

/**
 * Generates a unique slug by checking for conflicts in the database.
 * If a conflict exists, appends a timestamp suffix.
 */
export const generateUniqueSlug = async (bookName: string, bookId: string): Promise<string> => {
  const baseSlug = generateSlugFromBookName(bookName);
  
  // Check if slug already exists for a different book
  const { data: existing } = await supabase
    .from('daily_published')
    .select('id, book_id')
    .eq('slug', baseSlug)
    .maybeSingle();
  
  // If no conflict, or the existing record is for the same book, use base slug
  if (!existing || existing.book_id === bookId) {
    return baseSlug;
  }
  
  // Conflict exists - append timestamp for uniqueness
  const timestamp = Date.now().toString(36);
  return `${baseSlug.substring(0, 50)}-${timestamp}`;
};
