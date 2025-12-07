import { memo, useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { useBookTypes } from '@/hooks/useBookTypes';
import { CategoryBookCarousel } from './CategoryBookCarousel';
import { Card } from '@/components/ui/card';
import type { LibraryBook } from '@/types/library';
import type { LandingLibraryBook } from '@/types/book-extended';
import { LIBRARY_TEXT } from '@/config/libraryText';
import { LIBRARY_CONFIG } from '@/config/library';
import { LIBRARY_STYLES } from '@/styles/library.styles';
import { normalizeBookType } from '@/types/bookType';
import { LibraryBookSkeleton } from '@/components/ui/book-card-skeleton';

interface CategorizedBookSectionsProps {
  books: (LibraryBook | LandingLibraryBook)[];
  showAllCategories?: boolean;
  maxBooksPerCategory?: number;
  showViewAllLinks?: boolean;
  isLoading?: boolean;
}

export const CategorizedBookSections = memo(({
  books,
  showAllCategories = LIBRARY_CONFIG.SHOW_ALL_CATEGORIES,
  maxBooksPerCategory,
  showViewAllLinks = LIBRARY_CONFIG.SHOW_VIEW_ALL_LINKS,
  isLoading = false,
}: CategorizedBookSectionsProps) => {
  const { bookTypes } = useBookTypes();
  
  // Show loading shimmer while fetching
  if (isLoading) {
    return (
      <div className={LIBRARY_STYLES.page.content}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <LibraryBookSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  // Group books by category type
  const booksByCategory = useMemo(() => {
    const grouped: Record<string, typeof books> = {};
    
    books.forEach(book => {
      const metadata = book.metadata;
      
      // Try bookType first, then type (with safe access), then fall back to category field
      const bookType = metadata?.bookType;
      const metadataType = metadata && 'type' in metadata ? metadata.type : undefined;
      const categoryField = 'category' in book ? book.category : undefined;
      
      let type = bookType || metadataType;
      let validated = normalizeBookType(type);
      
      // Fall back to category field if metadata bookType is invalid
      if (!validated && typeof categoryField === 'string') {
        validated = normalizeBookType(categoryField);
      }
      
      // Final fallback to 'other'
      const finalType = validated || 'other';
      
      if (!grouped[finalType]) grouped[finalType] = [];
      grouped[finalType].push(book);
    });
    
    return grouped;
  }, [books]);

  // Filter book types that have books (or show all if showAllCategories is true)
  const categoriesToShow = useMemo(() => {
    return bookTypes.filter(bookType => {
      const hasBooks = booksByCategory[bookType.id]?.length > 0;
      return showAllCategories || hasBooks;
    });
  }, [bookTypes, booksByCategory, showAllCategories]);

  // Early return for completely empty state
  if (books.length === 0) {
    return (
      <Card className={LIBRARY_STYLES.emptyState.card}>
        <BookOpen className={LIBRARY_STYLES.emptyState.icon} />
        <p className={LIBRARY_STYLES.emptyState.text}>{LIBRARY_TEXT.EMPTY_STATE.NO_BOOKS}</p>
      </Card>
    );
  }

  // Return message if no categories to show
  if (categoriesToShow.length === 0) {
    return (
      <Card className={LIBRARY_STYLES.emptyState.card}>
        <BookOpen className={LIBRARY_STYLES.emptyState.icon} />
        <p className={LIBRARY_STYLES.emptyState.text}>{LIBRARY_TEXT.EMPTY_STATE.NO_CATEGORIES}</p>
      </Card>
    );
  }

  return (
    <div className={LIBRARY_STYLES.page.content}>
      {categoriesToShow.map((category) => {
        const categoryBooks = booksByCategory[category.id] || [];
        
        // Skip empty categories unless showAllCategories is true
        if (categoryBooks.length === 0 && !showAllCategories) {
          return null;
        }

        return (
          <CategoryBookCarousel
            key={category.id}
            categoryId={category.id}
            categoryLabel={category.label}
            categoryIcon={category.icon}
            categoryColor={category.color}
            books={categoryBooks}
            showViewAll={showViewAllLinks}
            maxBooks={maxBooksPerCategory}
          />
        );
      })}
    </div>
  );
});

CategorizedBookSections.displayName = 'CategorizedBookSections';
