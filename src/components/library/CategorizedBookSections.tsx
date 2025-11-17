import { memo, useMemo } from 'react';
import { CategoryBookCarousel } from './CategoryBookCarousel';
import { BOOK_TYPES } from '@/config/bookTypes';
import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import type { LibraryBook } from '@/types/library';
import type { LandingLibraryBook } from '@/types/book-extended';

interface CategorizedBookSectionsProps {
  books: (LibraryBook | LandingLibraryBook)[];
  showAllCategories?: boolean;
  maxBooksPerCategory?: number;
  showViewAllLinks?: boolean;
}

export const CategorizedBookSections = memo(({
  books,
  showAllCategories = false,
  maxBooksPerCategory,
  showViewAllLinks = false,
}: CategorizedBookSectionsProps) => {
  
  // Group books by category type
  const booksByCategory = useMemo(() => {
    const grouped: Record<string, typeof books> = {};
    
    books.forEach(book => {
      // Support both metadata.type and metadata.bookType with safe access
      const metadata = book.metadata;
      const type = (metadata && ('type' in metadata ? metadata.type : metadata.bookType)) || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(book);
    });
    
    return grouped;
  }, [books]);

  // Filter book types that have books (or show all if showAllCategories is true)
  const categoriesToShow = useMemo(() => {
    return BOOK_TYPES.filter(bookType => {
      const hasBooks = booksByCategory[bookType.id]?.length > 0;
      return showAllCategories || hasBooks;
    });
  }, [booksByCategory, showAllCategories]);

  // Show empty state if no books at all
  if (books.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No books available yet</p>
      </Card>
    );
  }

  // Show empty state if no categories have books
  if (categoriesToShow.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No categorized books found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {categoriesToShow.map(bookType => {
        const categoryBooks = booksByCategory[bookType.id] || [];
        
        // Skip empty categories unless showAllCategories is true
        if (!showAllCategories && categoryBooks.length === 0) {
          return null;
        }

        return (
          <CategoryBookCarousel
            key={bookType.id}
            categoryId={bookType.id}
            categoryLabel={bookType.label}
            categoryIcon={bookType.icon}
            categoryColor={bookType.color}
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
