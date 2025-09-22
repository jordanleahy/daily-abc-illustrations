import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock } from 'lucide-react';
import { useUpcomingDailyPublished } from '@/hooks/useUpcomingDailyPublished';
import { useSeoMetadataByBook } from '@/hooks/useSeoMetadata';
import { format } from 'date-fns';

interface BookPreviewCardProps {
  bookId: string;
  title: string;
  description?: string;
  publishDate: string;
}

function BookPreviewCard({ bookId, title, description, publishDate }: BookPreviewCardProps) {
  const { data: seoMetadata } = useSeoMetadataByBook(bookId);
  
  const formatPublishDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return format(date, 'EEEE, MMM d');
      }
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="shrink-0 border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* SEO Thumbnail */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {seoMetadata?.og_image_url ? (
              <img
                src={seoMetadata.og_image_url}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary/60" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground truncate mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {description}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatPublishDate(publishDate)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingBooksPreview() {
  const { data: upcomingBooks = [], isLoading } = useUpcomingDailyPublished(5);
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Coming Up Next</h2>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (upcomingBooks.length === 0) {
    return (
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Coming Up Next</h2>
        <p className="text-sm text-muted-foreground">
          No upcoming content scheduled yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-1">Coming Up Next</h2>
        <p className="text-xs text-muted-foreground">
          Discover what's coming in the next few days
        </p>
      </div>
      
      <ScrollArea className="h-64">
        <div className="space-y-3 pr-4">
          {upcomingBooks.map((item) => (
            <BookPreviewCard
              key={item.id}
              bookId={item.book_id}
              title={item.title}
              description={item.description || item.book.book_description}
              publishDate={item.publish_date}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}