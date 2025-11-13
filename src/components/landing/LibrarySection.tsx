import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Library } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LandingLibraryBook } from '@/hooks/useLandingPageData';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { LibraryBookSkeleton } from '@/components/ui/book-card-skeleton';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LibrarySectionProps {
  books: LandingLibraryBook[] | undefined;
}

/**
 * LandingLibraryCard - Displays a public book on the landing page for marketing
 * 
 * @description Showcases published books to unauthenticated visitors with
 * attractive hover effects and "Active Now" badges. Used exclusively on the
 * public landing page to drive signups and showcase platform content.
 * 
 * @data-source useLandingPageData() - Fetches from public API endpoint
 * @navigation Routes to /book/:slug for public preview or /pricing if no slug
 * @user-context Unauthenticated visitors exploring the platform
 * @features "Active Now" badge for current daily book, SEO-optimized titles,
 * target age display, hover effects with lift animation, optimized images with lazy loading
 */
function LandingLibraryCard({ item }: { item: LandingLibraryBook }) {
  const navigate = useNavigate();
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '100px', // Start loading 100px before entering viewport
    triggerOnce: true,
  });

  const handleCardClick = () => {
    if (item.slug) {
      navigate(`/book/${item.slug}`);
    } else {
      navigate('/pricing');
    }
  };

  return (
    <Card 
      ref={ref}
      onClick={handleCardClick}
      className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2"
    >
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
        {inView ? (
          <OptimizedImage
            src={item.og_image_url}
            alt={item.title}
            width={600}
            quality={80}
            srcSetSizes={[400, 600, 800, 1200]}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 400px"
            className="absolute inset-0"
            fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-bold text-primary/20">
                  {item.title.charAt(0)}
                </div>
              </div>
            }
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-6xl font-bold text-primary/20">
              {item.title.charAt(0)}
            </div>
          </div>
        )}
        {item.status === 'active' && item.is_active && (
          <Badge className="absolute top-3 left-3 bg-green-600 text-white z-10">
            Active Now
          </Badge>
        )}
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl line-clamp-2">
          {item.seo_title || item.title}
        </CardTitle>
        {item.metadata?.targetAge && (
          <p className="text-sm text-muted-foreground mt-1">
            {item.metadata.targetAge}
          </p>
        )}
      </CardHeader>
    </Card>
  );
}

interface LibrarySectionProps {
  books: LandingLibraryBook[] | undefined;
}

export const LibrarySection = ({ books }: LibrarySectionProps) => {
  const showSkeleton = !books || books.length === 0;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Library className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Complete Library</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse our complete daily published collection
          </p>
          {books && books.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {books.length} {books.length === 1 ? 'book' : 'books'} published
            </p>
          )}
        </div>

        {showSkeleton ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <LibraryBookSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((item) => (
              <LandingLibraryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
