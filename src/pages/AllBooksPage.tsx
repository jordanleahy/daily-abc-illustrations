import { useState, useEffect, useMemo } from 'react';
import { StandardPageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { BookFilterBar } from '@/components/filters';
import { LoadingState } from '@/components/ui/loading-state';
import { useBooks } from '@/hooks/useBooks';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { useDeleteBook } from '@/hooks/useDeleteBook';
import { AdminBookCard } from '@/components/books/AdminBookCard';
import { extractAvailableThemes } from '@/utils/themeFilters';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 24; // 4 rows of 6 books

export default function AllBooksPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  
  const { rawQuery: searchQuery, activeQuery: debouncedSearchQuery, setSearchQuery, isSearching } = useOptimizedSearch('debounced', 300);
  
  // Fetch books with server-side pagination and filtering
  const { books, totalCount, loading } = useBooks(
    'all-books',
    { page: currentPage, pageSize: PAGE_SIZE },
    debouncedSearchQuery,
    selectedThemes.length > 0 ? selectedThemes : undefined
  );
  
  const deleteBook = useDeleteBook();
  
  // Get all available themes for filter
  const availableThemes = useMemo(() => extractAvailableThemes([]), []);
  
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  
  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedThemes]);
  
  // Reset to last valid page if current exceeds total
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  const handleDelete = (bookId: string, bookName: string) => {
    deleteBook.mutate(bookId);
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Generate pagination items
  const paginationItems = useMemo(() => {
    const items: (number | 'ellipsis')[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    items.push(1);
    
    if (currentPage > 3) {
      items.push('ellipsis');
    }
    
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      items.push(i);
    }
    
    if (currentPage < totalPages - 2) {
      items.push('ellipsis');
    }
    
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    return items;
  }, [currentPage, totalPages]);

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">All Books</h1>
          <p className="text-muted-foreground">
            Admin view - All books in the system ({totalCount} total)
          </p>
        </div>

        {/* Search and filters */}
        <BookFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableThemes={availableThemes}
          selectedThemes={selectedThemes}
          onThemesChange={setSelectedThemes}
        />

        {/* Loading state */}
        {loading && books.length === 0 ? (
          <LoadingState text="Loading books..." />
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {debouncedSearchQuery || selectedThemes.length > 0
                ? 'No books match your search criteria'
                : 'No books found'}
            </p>
          </div>
        ) : (
          <>
            {/* Books grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
              {books.map((book) => (
                <AdminBookCard
                  key={book.id}
                  book={book}
                  onDelete={handleDelete}
                  isDeleting={deleteBook.isPending}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalCount} total books)
                </p>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                    </PaginationItem>
                    
                    {paginationItems.map((item, idx) => (
                      <PaginationItem key={idx}>
                        {item === 'ellipsis' ? (
                          <span className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <PaginationLink
                            isActive={item === currentPage}
                            onClick={() => handlePageChange(item as number)}
                          >
                            {item}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </StandardPageLayout>
  );
}
