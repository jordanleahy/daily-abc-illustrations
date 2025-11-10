import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useNavigate } from 'react-router-dom';
import { Book, Star } from 'lucide-react';
import { LandingPopularBook } from '@/hooks/useLandingPageData';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PopularBookSkeleton } from '@/components/ui/book-card-skeleton';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useAuthContext } from '@/contexts/AuthContext';

function PopularBookCard({ book, priority = false }: { book: LandingPopularBook; priority?: boolean }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '50px', // Start loading 50px before entering viewport
    triggerOnce: true,
  });

  const handleCardClick = () => {
    if (isAuthenticated) {
      navigate(`/library/${book.id}`);
    } else {
      navigate('/pricing');
    }
  };

  // Priority images (first 3) should load immediately without intersection observer
  const shouldLoad = priority || inView;

  return (
    <Card 
      ref={ref}
      className="cursor-pointer hover:shadow-lg transition-all relative ring-2 ring-primary shadow-md"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <Badge className="absolute top-4 right-4 bg-primary z-10">
          <Star className="h-3 w-3 mr-1 fill-current" />
          Featured
        </Badge>
        
        <AspectRatio ratio={1/1} className="bg-muted rounded-lg overflow-hidden mb-4">
          {shouldLoad ? (
            <OptimizedImage
              src={book.image_url}
              alt={book.book_name}
              width={600}
              quality={85}
              priority={priority}
              srcSetSizes={[400, 600, 800, 1200]}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 400px"
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <Book className="h-12 w-12 text-muted-foreground" />
                </div>
              }
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Book className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </AspectRatio>

        <div className="space-y-1">
          <h3 className="font-semibold text-lg line-clamp-2">
            {book.metadata?.bookType || book.book_name}
          </h3>
          {book.metadata?.targetAge && (
            <p className="text-sm text-muted-foreground">
              {book.metadata.targetAge}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PopularBooksProps {
  books: LandingPopularBook[] | undefined;
}

export const PopularBooks = ({ books }: PopularBooksProps) => {
  const showSkeleton = !books || books.length === 0;

  return (
    <section className="w-full py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Fall 2025 Themed Books
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showSkeleton ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <PopularBookSkeleton key={i} />
            ))
          ) : (
            books.map((book, index) => (
              <PopularBookCard key={book.id} book={book} priority={index < 3} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};
