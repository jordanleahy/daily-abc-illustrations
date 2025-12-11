import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BookImage } from '@/components/ui/book-image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { LibraryBookWithImages } from '@/hooks/useWinterThemedBooks';
import { trackBookView } from '@/utils/bookViewTracking';
import { formatDistanceToNow } from 'date-fns';
import { PremiumContentWrapper } from '@/components/subscription/PremiumContentWrapper';

type ViewMode = 'cover' | 'educational';

interface BookCarouselCardProps {
  book: LibraryBookWithImages;
  viewMode: ViewMode;
  onImageClick: () => void;
}

export const BookCarouselCard = memo(({ book, viewMode, onImageClick }: BookCarouselCardProps) => {
  const navigate = useNavigate();
  const bookData = book.book;

  const handleCardClick = () => {
    trackBookView(book.id);
    navigate(`/library/${book.id}/detail`);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageClick();
  };

  const publishedDate = book.published_at
    ? formatDistanceToNow(new Date(book.published_at), { addSuffix: true })
    : 'Recently';

  const imageUrl = viewMode === 'cover' 
    ? book.cover_image_url 
    : book.educational_image_url;

  return (
    <PremiumContentWrapper showOverlay={true}>
      <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <AspectRatio 
            ratio={1/1} 
            className="shadow-md hover:shadow-xl transition-shadow duration-300"
            onClick={handleImageClick}
          >
            <BookImage
              src={imageUrl || undefined}
              alt={bookData?.book_name || 'Book cover'}
              priority={false}
              disableHoverEffects={true}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </AspectRatio>
          <div className="p-4 space-y-2" onClick={handleCardClick}>
            <h3 className="font-semibold text-sm line-clamp-2">
              {bookData?.book_name || 'Untitled Book'}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {publishedDate}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </PremiumContentWrapper>
  );
});

BookCarouselCard.displayName = 'BookCarouselCard';
