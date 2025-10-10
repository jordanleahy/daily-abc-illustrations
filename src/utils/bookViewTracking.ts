/**
 * Book view tracking utilities
 * Tracks when books are viewed to enable "most recently viewed" sorting
 */

const BOOK_VIEWS_KEY = 'book_view_timestamps';

interface BookViewRecord {
  [bookId: string]: number; // timestamp in milliseconds
}

/**
 * Get all book view timestamps from localStorage
 */
export const getBookViewTimestamps = (): BookViewRecord => {
  try {
    const stored = localStorage.getItem(BOOK_VIEWS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to read book view timestamps:', error);
    return {};
  }
};

/**
 * Track that a book was viewed
 */
export const trackBookView = (bookId: string): void => {
  try {
    const views = getBookViewTimestamps();
    views[bookId] = Date.now();
    localStorage.setItem(BOOK_VIEWS_KEY, JSON.stringify(views));
  } catch (error) {
    console.warn('Failed to track book view:', error);
  }
};

/**
 * Get the last viewed timestamp for a specific book
 */
export const getBookViewTimestamp = (bookId: string): number | null => {
  const views = getBookViewTimestamps();
  return views[bookId] || null;
};

/**
 * Clear all book view tracking data
 */
export const clearBookViewTracking = (): void => {
  try {
    localStorage.removeItem(BOOK_VIEWS_KEY);
  } catch (error) {
    console.warn('Failed to clear book view tracking:', error);
  }
};
