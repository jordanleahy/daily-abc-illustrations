import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePublicBookBySlug } from '@/hooks/usePublicBookBySlug';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { usePublicPageImage } from '@/hooks/usePublicPageImage';
import { useSeoMetadata, useSeoMetadataByBook } from '@/hooks/useSeoMetadata';
import { usePublicBookImagePreloader } from '@/hooks/usePublicBookImagePreloader';
import { usePublicBookColoringImages } from '@/hooks/usePublicBookColoringImages';
import { MetaHead } from '@/components/common';
import { generateDailyPublishedOpenGraph } from '@/utils/openGraph';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookImage } from '@/components/ui/book-image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Plus, Loader2, Palette, UserPlus } from 'lucide-react';
import { PublicBookShareDrawer } from '@/components/book/PublicBookShareDrawer';
import { Skeleton } from '@/components/ui/skeleton';

const PublicBookPageCard = ({ page, index, isLocked }: { page: any; index: number; isLocked: boolean }) => {
  const { data: imageData } = usePublicPageImage(page.id);
  const navigate = useNavigate();

  const handleLockedClick = () => {
    navigate('/auth?mode=signup');
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <AspectRatio ratio={1/1} className="relative bg-muted">
          <BookImage
            src={imageData?.image_url}
            alt={`Letter ${page.letter} - ${page.title}`}
            priority={index < 3}
            className={`w-full h-full object-cover ${isLocked ? 'blur-md' : ''}`}
          />
          
          {isLocked && (
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-background/70 transition-colors"
              onClick={handleLockedClick}
            >
              <Plus className="h-12 w-12 mb-3 text-primary" />
              <p className="text-sm text-muted-foreground">
                Subscribe to View
              </p>
            </div>
          )}
        </AspectRatio>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">{page.title}</h3>
        </div>
      </CardContent>
    </Card>
  );
};

export default function PublicBook() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: bookData, isLoading: bookLoading } = usePublicBookBySlug(slug);
  const { data: pages, isLoading: pagesLoading } = useDailyPublishedPages(bookData?.book_id);
  const { data: coloringImages } = usePublicBookColoringImages(bookData?.book_id);
  
  // Preload all page images for instant display
  usePublicBookImagePreloader(pages, bookData?.book_id);
  
  // Get SEO metadata based on source type
  // For daily_published: use the daily_published_id
  // For marketing: use the book_id
  const dailyPublishedId = bookData?.source_type === 'daily_published' ? bookData.id : undefined;
  const { data: seoByDaily } = useSeoMetadata(dailyPublishedId);
  const { data: seoByBook } = useSeoMetadataByBook(bookData?.book_id);
  const seoMetadata = seoByDaily || seoByBook;

  // Generate OpenGraph metadata
  const ogMetadata = bookData ? generateDailyPublishedOpenGraph(
    seoMetadata?.seo_title || bookData.title,
    seoMetadata?.seo_description || bookData.description || '',
    undefined,
    bookData.total_pages || 26,
    bookData.id,
    undefined,
    undefined,
    seoMetadata?.seo_title,
    seoMetadata?.seo_description
  ) : null;

  const handleColoringSignup = () => {
    navigate('/auth?mode=signup');
  };

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

  const hasColoringPages = coloringImages && coloringImages.length > 0;
  const last3ColoringImages = hasColoringPages ? coloringImages.slice(-3) : [];
  const first3Pages = pages?.slice(0, 3) || [];
  const remainingPages = pages?.slice(3) || [];

  return (
    <>
      {ogMetadata && <MetaHead metadata={ogMetadata} />}
      
      <StandardPageLayout>
        <div className="py-8 md:py-12 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {seoMetadata?.seo_title || bookData.title}
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                {seoMetadata?.seo_description || bookData.description}
              </p>
            </div>
            
            {/* Share Button */}
            <PublicBookShareDrawer 
              bookId={bookData.book_id}
              bookTitle={bookData.title}
              publicUrl={window.location.href}
            />
          </div>

          {/* First 3 Page Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {first3Pages.length > 0 ? (
              first3Pages.map((page, index) => (
                <PublicBookPageCard 
                  key={page.id} 
                  page={page}
                  index={index}
                  isLocked={false}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading pages...</p>
              </div>
            )}
          </div>

          {/* Coloring Pages Section - Only show if coloring images exist */}
          {hasColoringPages && last3ColoringImages.length > 0 && (
            <div className="p-6 rounded-lg border-2 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 justify-center mb-4">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Free Coloring Pages</h3>
              </div>
              <p className="text-muted-foreground text-center mb-6">
                Get {coloringImages.length} printable coloring pages from this book!
              </p>
              
              {/* Last 3 Coloring Image Previews */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {last3ColoringImages.map((coloringImage) => (
                  <AspectRatio 
                    key={coloringImage.page_id} 
                    ratio={1/1} 
                    className="rounded-lg overflow-hidden border border-border bg-white"
                  >
                    <OptimizedImage 
                      src={coloringImage.coloring_image_url} 
                      alt={`Coloring page for letter ${coloringImage.letter}`}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                ))}
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={handleColoringSignup}
                  className="gap-2"
                  size="lg"
                >
                  <UserPlus className="h-4 w-4" />
                  Create Account to Download
                </Button>
              </div>
            </div>
          )}

          {/* Remaining Page Cards (Locked) */}
          {remainingPages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingPages.map((page, index) => (
                <PublicBookPageCard 
                  key={page.id} 
                  page={page}
                  index={index + 3}
                  isLocked={true}
                />
              ))}
            </div>
          )}

        </div>
      </StandardPageLayout>
    </>
  );
}
