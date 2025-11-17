import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooksDecoupled } from '@/hooks/useLibraryBooksDecoupled';
import { useFavorites } from '@/hooks/useFavorites';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { MetaHead } from '@/components/common';
import { StandardPageLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { PremiumGate } from '@/components/subscription/PremiumGate';
import { CategorizedBookSections } from '@/components/library/CategorizedBookSections';
import { LIBRARY_TEXT } from '@/config/libraryText';
import { LIBRARY_STYLES } from '@/styles/library.styles';

const Library = memo(() => {
  const navigate = useNavigate();
  const { hasLibraryAccess } = useFeatureAccess();
  
  const { data: libraryBooks = [], isLoading: isLoadingBooks } = useLibraryBooksDecoupled();
  const { favorites } = useFavorites();

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
          
          {hasLibraryAccess ? (
            <CategorizedBookSections 
              books={libraryBooks}
            />
          ) : (
            <PremiumGate>
              <p className="text-center">{LIBRARY_TEXT.PREMIUM_GATE_MESSAGE}</p>
            </PremiumGate>
          )}
        </div>
      </StandardPageLayout>
    </>
  );
});

Library.displayName = 'Library';

export default Library;
