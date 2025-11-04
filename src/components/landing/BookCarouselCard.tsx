import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BookImage } from '@/components/ui/book-image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { trackBookView } from '@/utils/bookViewTracking';
import { formatDistanceToNow } from 'date-fns';
import { PremiumContentWrapper } from '@/components/subscription/PremiumContentWrapper';

interface BookCarouselCardProps {
  book: DailyPublishedWithBook;
}

export const BookCarouselCard = memo(({ book }: BookCarouselCardProps) => {
  const navigate = useNavigate();
  const bookData = book.book;

  const handleClick = () => {
    trackBookView(book.id);
    navigate(`/library/${book.id}/detail`);
  };

  const publishedDate = book.published_at
    ? formatDistanceToNow(new Date(book.published_at), { addSuffix: true })
    : 'Recently';

  return (
    <PremiumContentWrapper showOverlay={true}>
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleClick}
      >
        <CardContent className="p-0">
          <AspectRatio ratio={1}>
            <BookImage
              src={book.og_image_url || undefined}
              alt={bookData?.book_name || 'Book cover'}
              priority={false}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
          <div className="p-4 space-y-2">
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
