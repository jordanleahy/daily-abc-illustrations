import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BookImage } from '@/components/ui/book-image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { DailyPublishedWithActivity } from '@/hooks/useKidRecentlyRead';
import { trackBookView } from '@/utils/bookViewTracking';
import { formatDistanceToNow } from 'date-fns';
import { PremiumContentWrapper } from '@/components/subscription/PremiumContentWrapper';
import { Clock } from 'lucide-react';

interface BookCarouselCardProps {
  book: DailyPublishedWithBook | DailyPublishedWithActivity;
}

export const BookCarouselCard = memo(({ book }: BookCarouselCardProps) => {
  const navigate = useNavigate();
  const bookData = book.book;
  const activityBook = book as DailyPublishedWithActivity;

  const handleClick = () => {
    trackBookView(book.id);
    navigate(`/library/${book.id}/detail`);
  };

  // Show last viewed time if available (from activity), otherwise show published date
  const displayDate = activityBook.last_viewed_at
    ? formatDistanceToNow(new Date(activityBook.last_viewed_at), { addSuffix: true })
    : book.published_at
    ? formatDistanceToNow(new Date(book.published_at), { addSuffix: true })
    : 'Recently';
  
  const dateLabel = activityBook.last_viewed_at ? 'Last read' : 'Published';

  return (
    <PremiumContentWrapper showOverlay={true}>
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleClick}
      >
        <CardContent className="p-0">
          <AspectRatio ratio={16/9}>
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{dateLabel} {displayDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PremiumContentWrapper>
  );
});

BookCarouselCard.displayName = 'BookCarouselCard';
