import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooksDecoupled } from '@/hooks/useLibraryBooksDecoupled';
import { useFavorites } from '@/hooks/useFavorites';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { MetaHead } from '@/components/common';
import { StandardPageLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { PremiumGate } from '@/components/subscription/PremiumGate';
import { CategorizedBookSections } from '@/components/library/CategorizedBookSections';
import { BookFilterBar } from '@/components/filters';
import { LIBRARY_TEXT } from '@/config/libraryText';
import { LIBRARY_STYLES } from '@/styles/library.styles';
import { extractAvailableThemes, filterBooksByThemeAndSearch } from '@/utils/themeFilters';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';

const Library = memo(() => {
  const navigate = useNavigate();
  
  const { data: libraryBooks = [], isLoading: isLoadingBooks } = useLibraryBooksDecoupled();
  const { favorites } = useFavorites();
  
  // ⚡ PERFORMANCE OPTIMIZATION: Three strategies available
  // 1. 'debounced' (default) - Best for large lists, delays filtering
  // 2. 'transition' - Non-blocking updates, keeps UI responsive  
  // 3. 'immediate' - No delay, requires well-memoized filters
  const { rawQuery, activeQuery, setSearchQuery, isSearching } = useOptimizedSearch('debounced', 300);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  
  // Extract available themes from library books
  const availableThemes = useMemo(() => 
    extractAvailableThemes(libraryBooks),
    [libraryBooks]
  );
  
  // Apply filters using activeQuery (debounced/optimized value)
  const filteredBooks = useMemo(() => 
    filterBooksByThemeAndSearch(libraryBooks, activeQuery, selectedThemes),
    [libraryBooks, activeQuery, selectedThemes]
  );

  if (isLoadingBooks) {
    return (
      <>
        <MetaHead 
          metadata={{
            title: LIBRARY_TEXT.META_TITLE,
            description: LIBRARY_TEXT.META_DESCRIPTION,
            type: 'website'
          }}
        />
        <StandardPageLayout>
          <LoadingState text={LIBRARY_TEXT.LOADING} />
        </StandardPageLayout>
      </>
    );
  }

  return (
    <>
      <MetaHead 
        metadata={{
          title: LIBRARY_TEXT.META_TITLE,
          description: LIBRARY_TEXT.META_DESCRIPTION,
          type: 'website'
        }}
      />
      <StandardPageLayout>
        <div className={LIBRARY_STYLES.page.container}>
          <div className={LIBRARY_STYLES.page.header.container}>
            <h1 className={LIBRARY_STYLES.page.header.title}>{LIBRARY_TEXT.PAGE_TITLE}</h1>
            <p className={LIBRARY_STYLES.page.header.subtitle}>{LIBRARY_TEXT.PAGE_SUBTITLE}</p>
          </div>
          
          {/* Book Filters - Available to all users */}
          {libraryBooks.length > 0 && (
            <div className="mb-6">
              <BookFilterBar
                searchQuery={rawQuery}
                onSearchChange={setSearchQuery}
                selectedThemes={selectedThemes}
                onThemesChange={setSelectedThemes}
                availableThemes={availableThemes}
                placeholder={isSearching ? "Searching..." : "Search library books..."}
              />
            </div>
          )}
          
          {/* Book Sections - Available to all users (upgrade modal on click) */}
          {filteredBooks.length > 0 ? (
            <CategorizedBookSections 
              books={filteredBooks}
              showAllCategories={true}
            />
          ) : libraryBooks.length > 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No books found matching your filters.
              </p>
            </div>
          ) : null}
        </div>
      </StandardPageLayout>
    </>
  );
});

Library.displayName = 'Library';

export default Library;
