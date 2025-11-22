import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookImage } from '@/components/ui/book-image';
import { Badge } from '@/components/ui/badge';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { trackBookView } from '@/utils/bookViewTracking';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { LibraryUpgradeModal } from './LibraryUpgradeModal';
import type { LibraryBook } from '@/types/library';
import type { LandingLibraryBook } from '@/types/book-extended';
import { LIBRARY_ROUTES } from '@/config/routes';
import { LIBRARY_TEXT } from '@/config/libraryText';
import { LIBRARY_CONFIG } from '@/config/library';
import { LIBRARY_STYLES } from '@/styles/library.styles';

interface LibraryBookCardProps {
  book: LibraryBook | LandingLibraryBook;
  priority?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const LibraryBookCard = memo(({ book, priority = false, size = 'medium' }: LibraryBookCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: kidProfiles = [] } = useKidProfiles();
  const { hasActiveSubscription } = useSubscription();
  const { ref: cardRef, inView: isInView } = useIntersectionObserver({
    threshold: LIBRARY_CONFIG.INTERSECTION_THRESHOLD,
    rootMargin: LIBRARY_CONFIG.INTERSECTION_ROOT_MARGIN,
    triggerOnce: true,
  });

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleCardClick = () => {
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }

    if (!hasActiveSubscription) {
      setShowUpgradeModal(true);
      return;
    }
    
    const kidId = kidProfiles.length > 0 ? kidProfiles[0].id : undefined;
    trackBookView(book.id, kidId);
    navigate(LIBRARY_ROUTES.BOOK_DETAIL(book.id));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStart) return;
    
    const deltaX = Math.abs(e.clientX - dragStart.x);
    const deltaY = Math.abs(e.clientY - dragStart.y);
    
    // If movement is below threshold, treat as click
    if (deltaX < LIBRARY_CONFIG.DRAG_THRESHOLD_PX && deltaY < LIBRARY_CONFIG.DRAG_THRESHOLD_PX) {
      handleCardClick();
    }
    
    setDragStart(null);
  };

  // Extract metadata
  const metadata = book.metadata;
  const targetAge = metadata?.targetAge;
  
  // Get cover image
  const coverImage = 'cover_image' in book ? book.cover_image : ('image_url' in book ? book.image_url : null);

  return (
    <>
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={LIBRARY_STYLES.bookCard.container}
      >
        {book.is_highlighted && (
          <Badge className={LIBRARY_STYLES.bookCard.badge}>
            {LIBRARY_TEXT.BADGES.FEATURED}
          </Badge>
        )}
        
        <div className={LIBRARY_STYLES.bookCard.imageContainer}>
          {isInView && coverImage ? (
            <BookImage
              src={coverImage}
              alt={book.book_name}
              priority={priority}
              className={LIBRARY_STYLES.bookCard.image}
              enableMobileSave={true}
            />
          ) : (
            <div className={LIBRARY_STYLES.bookCard.placeholder.container}>
              <div className={LIBRARY_STYLES.bookCard.placeholder.text}>
                {book.book_name.charAt(0)}
              </div>
            </div>
          )}
        </div>

        <div className={LIBRARY_STYLES.bookCard.content}>
          <h3 className={LIBRARY_STYLES.bookCard.title}>
            {book.book_name}
          </h3>
          {targetAge && (
            <p className={LIBRARY_STYLES.bookCard.targetAge}>
              {targetAge}
            </p>
          )}
        </div>
      </div>
      
      <LibraryUpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        bookTitle={book.book_name}
      />
    </>
  );
});

LibraryBookCard.displayName = 'LibraryBookCard';
