import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooksDecoupled } from '@/hooks/useLibraryBooksDecoupled';
import { useFavorites } from '@/hooks/useFavorites';
import { usePredictivePrefetch } from '@/hooks/usePredictivePrefetch';
import { MetaHead } from '@/components/common/MetaHead';
import { StandardPageLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { PremiumGate } from '@/components/subscription/PremiumGate';
import { CategorizedBookSections } from '@/components/library';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const Library = memo(() => {
  const navigate = useNavigate();
  const { hasLibraryAccess } = useFeatureAccess();
  
  const { data: libraryBooks = [], isLoading: isLoadingLibrary } = useLibraryBooksDecoupled();
  const { favorites } = useFavorites();

  // Prefetch strategies (disabled for now)

  if (isLoadingLibrary) {
    return (
      <StandardPageLayout>
        <LoadingState text="Loading library..." />
      </StandardPageLayout>
    );
  }

  return (
    <>
      <MetaHead metadata={{
        title: "Library - Daily ABC Illustrations",
        description: "Your books and our daily published ABC illustration books.",
        type: "website"
      }} />
      
      <StandardPageLayout containerClassName="pb-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Library</h2>
            <p className="text-muted-foreground">
              Your collection of ABC books
            </p>
          </div>

          {!hasLibraryAccess ? (
            <PremiumGate>
              <p className="text-center">Subscribe to access the full library of ABC books</p>
            </PremiumGate>
          ) : (
            <CategorizedBookSections
              books={libraryBooks}
              showAllCategories={true}
              showViewAllLinks={false}
            />
          )}
        </div>
      </StandardPageLayout>
    </>
  );
});

Library.displayName = 'Library';

export default Library;
