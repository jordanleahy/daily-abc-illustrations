import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyPublishedSchedule } from '@/hooks/useDailyPublishedSchedule';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Clock, BookOpen, Image } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { toEasternTime } from '@/utils/timezone';
import { format } from 'date-fns-tz';

// Utility functions (reused from FullScheduleView)
const formatScheduleDate = (dateString: string, options?: {
  includeTime?: boolean;
}) => {
  const date = new Date(dateString);
  if (!options?.includeTime) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }) + ' at 7:01 AM ET';
};

// Helper function to get day name for queue position
const getPublishDayName = (position: number): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + position);
  const easternTime = toEasternTime(tomorrow);
  return format(easternTime, 'EEEE'); // Full day name like "Monday"
};

interface EmbeddedScheduleViewProps {
  /** Current daily published content ID to filter out from schedule */
  currentContentId?: string;
}

export function EmbeddedScheduleView({ currentContentId }: EmbeddedScheduleViewProps) {
  const {
    data: scheduleItems,
    isLoading,
    error
  } = useDailyPublishedSchedule();

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground text-sm mt-2">Loading upcoming books...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive text-sm text-center">Error loading schedule</p>
      </div>
    );
  }

  // Filter out current content and sort items
  const filteredItems = scheduleItems?.filter(item => item.id !== currentContentId) || [];
  const queuedItems = filteredItems.filter(item => item.status === 'queued').sort((a, b) => (a.queue_order || 0) - (b.queue_order || 0));
  const expiredItems = filteredItems.filter(item => item.status === 'expired').slice(0, 3); // Limit to recent 3

  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-t-3xl px-4 py-6 space-y-6">
      {/* Upcoming Books */}
      {queuedItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            📅 Upcoming Books
          </h3>
          <div className="space-y-3">
            {queuedItems.slice(0, 3).map((item, index) => (
              <EmbeddedScheduleCard key={item.id} item={item} position={index + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Past Books */}
      {expiredItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Past Books
          </h3>
          <div className="space-y-3 opacity-70">
            {expiredItems.map(item => (
              <EmbeddedScheduleCard 
                key={item.id} 
                item={item}
                position="expired"
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {queuedItems.length === 0 && expiredItems.length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No additional books available</p>
        </div>
      )}
    </div>
  );
}

// Compact schedule card for embedded view
function EmbeddedScheduleCard({
  item,
  position
}: {
  item: DailyPublishedWithBook;
  position: number | "expired";
}) {
  const navigate = useNavigate();
  const { data: seoMetadata } = useSeoMetadata(item.id);

  const handleCardClick = () => {
    navigate(`/daily-published/${item.id}`);
  };

  const isQueued = item.status === 'queued' && typeof position === 'number';
  const isExpired = position === "expired";

  return (
    <Card 
      className="transition-all duration-200 hover:shadow-md cursor-pointer" 
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3 p-3">
        <div className="flex gap-3 items-center">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {seoMetadata?.og_image_url ? (
              <img src={seoMetadata.og_image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <Image className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">{item.title}</CardTitle>
            <CardDescription className="text-xs mt-1 truncate">
              {item.book.book_name}
            </CardDescription>
            
            {/* Schedule Info */}
            <div className="text-xs text-muted-foreground mt-1">
              {isQueued && (
                <span>{getPublishDayName(position as number)}</span>
              )}
              {isExpired && (
                <span>Published {formatScheduleDate(item.publish_date)}</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}