import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookImage } from '@/components/ui/book-image';
import { Badge } from '@/components/ui/badge';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { trackBookView } from '@/utils/bookViewTracking';
import { useAuthContext } from '@/contexts/AuthContext';
import type { LibraryBook } from '@/types/library';
import type { LandingLibraryBook } from '@/types/book-extended';

interface LibraryBookCardProps {
  book: LibraryBook | LandingLibraryBook;
  priority?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const LibraryBookCard = memo(({ book, priority = false, size = 'medium' }: LibraryBookCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { ref: cardRef, inView: isInView } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true,
  });

  const handleCardClick = () => {
    if (user) {
      trackBookView(book.id);
      navigate(`/library/${book.id}`);
    } else {
      navigate('/pricing');
    }
  };

  // Extract metadata
  const metadata = book.metadata;
  const targetAge = metadata?.targetAge;
  
  // Get cover image
  const coverImage = 'cover_image' in book ? book.cover_image : ('image_url' in book ? book.image_url : null);

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      className="group relative bg-card hover:bg-accent/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
    >
      {book.is_highlighted && (
        <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground z-10 text-xs">
          Featured
        </Badge>
      )}
      
      <div className="aspect-square relative overflow-hidden bg-muted">
        {isInView && coverImage ? (
          <BookImage
            src={coverImage}
            alt={book.book_name}
            priority={priority}
            className="w-full h-full object-cover"
            enableMobileSave={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl font-bold text-primary/20">
              {book.book_name.charAt(0)}
            </div>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
          {book.book_name}
        </h3>
        {targetAge && (
          <p className="text-xs text-muted-foreground">
            {targetAge}
          </p>
        )}
      </div>
    </div>
  );
});

LibraryBookCard.displayName = 'LibraryBookCard';
