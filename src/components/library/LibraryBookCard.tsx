import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookImage } from '@/components/ui/book-image';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { trackBookView } from '@/utils/bookViewTracking';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAccessResolver } from '@/hooks/useAccessResolver';
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
  const { accessState } = useAccessResolver();
  const { ref: cardRef, inView: isInView } = useIntersectionObserver({
    threshold: LIBRARY_CONFIG.INTERSECTION_THRESHOLD,
    rootMargin: LIBRARY_CONFIG.INTERSECTION_ROOT_MARGIN,
    triggerOnce: true,
  });

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleCardClick = () => {
    // Non-authenticated users go to public book page
    if (!user) {
      const slug = 'slug' in book ? book.slug : book.id;
      navigate(`/book/${slug}`);
      return;
    }

    // Only block if we're certain the user is locked (not during loading)
    // This gives benefit of the doubt during loading states
    if (accessState === 'locked') {
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
  
  // Get cover image and completion count
  const coverImage = 'cover_image' in book ? book.cover_image : ('image_url' in book ? book.image_url : null);
  const completionCount = 'completion_count' in book ? book.completion_count : 0;

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
        
        {completionCount > 0 && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
            <CheckCircle className="w-3 h-3" />
            <span>{completionCount}×</span>
          </div>
        )}
        
        <div className={LIBRARY_STYLES.bookCard.imageContainer}>
          {isInView && coverImage ? (
            <BookImage
              src={coverImage}
              alt={book.book_name}
              priority={priority}
              className={LIBRARY_STYLES.bookCard.image}
              interceptCopyAsImage={true}
            />
          ) : (
            <div className={LIBRARY_STYLES.bookCard.placeholder.container}>
              <div className={LIBRARY_STYLES.bookCard.placeholder.text}>
                {book.book_name.charAt(0)}
              </div>
            </div>
          )}
        </div>

        <div
          className="px-1 pt-2"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/printable-colorbook/${book.id}`);
            }}
          >
            <Palette className="w-4 h-4" />
            ColorBook
          </Button>
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
