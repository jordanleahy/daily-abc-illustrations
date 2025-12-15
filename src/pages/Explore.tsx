import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { CategorizedBookSections } from '@/components/library';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { MetaHead } from '@/components/common/MetaHead';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { Library } from 'lucide-react';

/**
 * Explore Page - Public library browser for unauthenticated visitors
 * 
 * Shows all published library books organized by category (ABC, Rhyming, etc.)
 * accessible without authentication. Designed to showcase content and drive signups.
 */
const Explore = () => {
  const { data: libraryBooks = [], isLoading } = useLibraryBooks();

  return (
    <>
      <MetaHead 
        metadata={{
          title: `Library | ${getSiteTitle()}`,
          description: `Browse our complete collection of educational children's books. ABC books, rhyming stories, colors, shapes, and more - all designed for toddlers and early readers.`,
          siteName: SITE_CONFIG.name,
        }}
      />
      <PreviewPageLayout>
        <div className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Library className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Explore Our Library
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Browse our complete collection of AI-generated educational books for toddlers and early readers
              </p>
              {libraryBooks.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {libraryBooks.length} {libraryBooks.length === 1 ? 'book' : 'books'} available
                </p>
              )}
            </div>

            {/* Book Sections */}
            <CategorizedBookSections
              books={libraryBooks}
              showAllCategories={true}
              isLoading={isLoading}
            />
          </div>
        </div>
      </PreviewPageLayout>
    </>
  );
};

export default Explore;
