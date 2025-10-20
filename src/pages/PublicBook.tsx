import { useParams, Link } from 'react-router-dom';
import { usePublicBookBySlug } from '@/hooks/usePublicBookBySlug';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { useSeoMetadata, useSeoMetadataByBook } from '@/hooks/useSeoMetadata';
import { MetaHead } from '@/components/common';
import { generateDailyPublishedOpenGraph } from '@/utils/openGraph';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Plus, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PublicBookPageCard = ({ page }: { page: any }) => {
  const { data: imageData } = usePublicPageImage(page.id);
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="aspect-square relative bg-muted">
          {imageData?.image_url ? (
            <img
              src={imageData.image_url}
              alt={`Letter ${page.letter} - ${page.title}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
            {page.letter}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">{page.title}</h3>
          {page.content?.mainConcept && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {page.content.mainConcept}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function PublicBook() {
  const { slug } = useParams<{ slug: string }>();
  const { data: bookData, isLoading: bookLoading } = usePublicBookBySlug(slug);
  const { data: pages, isLoading: pagesLoading } = useDailyPublishedPages(bookData?.book_id);
  
  // Try to get SEO metadata by daily_published_id first, then by book_id
  const { data: seoByDaily } = useSeoMetadata(bookData?.id);
  const { data: seoByBook } = useSeoMetadataByBook(bookData?.book_id);
  const seoMetadata = seoByDaily || seoByBook;

  // Generate OpenGraph metadata
  const ogMetadata = bookData ? generateDailyPublishedOpenGraph(
    seoMetadata?.seo_title || bookData.title,
    seoMetadata?.seo_description || bookData.description,
    undefined,
    26,
    bookData.id,
    undefined,
    undefined,
    seoMetadata?.seo_title,
    seoMetadata?.seo_description
  ) : null;

  if (bookLoading || pagesLoading) {
    return (
      <StandardPageLayout>
        <div className="py-12 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  if (!bookData) {
    return (
      <StandardPageLayout>
        <div className="py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Book Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This book is not available or has been removed.
          </p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <>
      {ogMetadata && <MetaHead metadata={ogMetadata} />}
      
      <StandardPageLayout>
        <div className="py-8 md:py-12 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                  {seoMetadata?.seo_title || bookData.title}
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                  {seoMetadata?.seo_description || bookData.description}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="icon" variant="outline" title="Add to favorites">
                  <Plus className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="outline" title="Download PDF">
                  <Download className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Letter Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages && pages.length > 0 ? (
              pages.map((page) => (
                <PublicBookPageCard 
                  key={page.id} 
                  page={page} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading pages...</p>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="mt-12 p-8 rounded-lg bg-muted text-center">
            <h2 className="text-2xl font-bold mb-3">
              Want to create your own ABC book?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Sign up to create custom educational books with AI-powered illustrations
              and interactive learning activities.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/auth?mode=signup">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </StandardPageLayout>
    </>
  );
}
