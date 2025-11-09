/**
 * @fileoverview Unified library hook that combines user's books with official library
 * 
 * This hook provides a unified view of both:
 * 1. User's own created books (always accessible)
 * 2. Official daily published library books (subscription required)
 * 
 * It handles deduplication to prevent showing the same book twice if a user's
 * book has been officially published to the library.
 * 
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { useBooks } from './useBooks';
import { useLibraryBooks } from './useLibraryBooks';
import { useFeatureAccess } from './useFeatureAccess';

/**
 * Unified library hook
 * 
 * Combines user's books with official library books, handling access control
 * and deduplication automatically.
 * 
 * @hook
 * @returns {Object} Unified library data
 * @returns {Array} myBooks - User's own created books (always accessible)
 * @returns {Array} libraryBooks - Official library books (subscription required)
 * @returns {boolean} hasLibraryAccess - Whether user can access library
 * @returns {boolean} isLoading - Whether data is being loaded
 * 
 * @example
 * ```tsx
 * const { myBooks, libraryBooks, hasLibraryAccess } = useUnifiedLibrary();
 * 
 * return (
 *   <>
 *     <section>
 *       <h2>My Books</h2>
 *       {myBooks.map(book => <BookCard key={book.id} book={book} />)}
 *     </section>
 *     
 *     {hasLibraryAccess && (
 *       <section>
 *         <h2>Official Library</h2>
 *         {libraryBooks.map(book => <BookCard key={book.id} book={book} />)}
 *       </section>
 *     )}
 *   </>
 * );
 * ```
 */
export const useUnifiedLibrary = () => {
  const { books: userBooks, loading: userBooksLoading } = useBooks();
  const { data: libraryBooksData, isLoading: libraryLoading } = useLibraryBooks();
  const { hasLibraryAccess, loading: accessLoading } = useFeatureAccess();

  // User's books - always show all of them in My Books section
  const myBooks = useMemo(() => {
    return userBooks || [];
  }, [userBooks]);

  // Library books - exclude user's own books from library section
  const libraryBooks = useMemo(() => {
    if (!hasLibraryAccess || !libraryBooksData) return [];
    
    const userBookIds = new Set(userBooks?.map(b => b.id) || []);
    return libraryBooksData.filter(lb => !userBookIds.has(lb.book_id));
  }, [hasLibraryAccess, libraryBooksData, userBooks]);

  return {
    myBooks,
    libraryBooks,
    hasLibraryAccess,
    isLoading: userBooksLoading || libraryLoading || accessLoading,
  };
};
