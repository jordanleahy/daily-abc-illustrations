/**
 * Type-safe enum for book types
 * Synced with backend VALID_BOOK_TYPES in supabase/functions/_shared/types.ts
 */
export const BOOK_TYPE_IDS = [
  'abc',
  'numbers', 
  'shapes',
  'colors',
  'rhyming',
  'opposites',
  'emotions',
  'animals',
  'first-words',
  'bedtime',
  'cvc',
  'sight-words',
  'general',
  'digraphs',
  'other'
] as const;

export type BookTypeId = typeof BOOK_TYPE_IDS[number];

/**
 * Validates if a value is a valid book type
 * @param value - Value to check
 * @returns true if value is a valid BookTypeId
 */
export function isValidBookType(value: unknown): value is BookTypeId {
  return typeof value === 'string' && BOOK_TYPE_IDS.includes(value as BookTypeId);
}

/**
 * Normalizes and validates a book type string
 * Converts to kebab-case and validates against known types
 * @param bookType - Book type string to normalize
 * @returns Validated BookTypeId or undefined if invalid
 */
export function normalizeBookType(bookType: string | undefined): BookTypeId | undefined {
  if (!bookType) return undefined;
  
  // Convert to kebab-case
  const normalized = bookType.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Validate against known types
  if (isValidBookType(normalized)) {
    return normalized;
  }
  
  console.warn(`[Book Type Validation] Invalid book type: "${bookType}", normalized to: "${normalized}"`);
  return undefined;
}

/**
 * Gets display-friendly label for a book type
 * @param bookTypeId - Book type ID
 * @returns Human-readable label
 */
export function getBookTypeDisplayName(bookTypeId: BookTypeId): string {
  // Split on hyphens, capitalize each word
  return bookTypeId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
