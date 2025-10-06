import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyPublishedSchedule } from '@/hooks/useDailyPublishedSchedule';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { useScheduleImagePreloader } from '@/hooks/useScheduleImagePreloader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Clock, BookOpen, Image, Calendar, ExternalLink } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { toEasternTime } from '@/utils/timezone';
import { format } from 'date-fns-tz';

// Helper function to get day name for queue position
const getPublishDayName = (position: number): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + position);
  const easternTime = toEasternTime(tomorrow);
  return format(easternTime, 'EEEE'); // Full day name like "Monday"
};

function ScheduleThumbnail({
  imageUrl,
  title
}: {
  imageUrl?: string;
  title: string;
}) {
  return (
    <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      ) : (
        <Image className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

interface SchedulePreviewCardProps {
  item: DailyPublishedWithBook;
  position: number | "active" | "expired";
}

function SchedulePreviewCard({ item, position }: SchedulePreviewCardProps) {
  const navigate = useNavigate();
  const { data: seoMetadata } = useSeoMetadata(item.id);
  
  const handleCardClick = () => {
    if (item.status === 'active') {
      navigate(`/daily-published/${item.id}`);
    }
  };
  
  const isActive = item.status === 'active';
  const isQueued = item.status === 'queued' && typeof position === 'number';
  
  return (
    <Card 
      className={`transition-shadow group ${isActive ? "cursor-pointer hover:shadow-md" : ""}`} 
      onClick={isActive ? handleCardClick : undefined}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex gap-3 items-center">
          {/* Thumbnail */}
          <ScheduleThumbnail imageUrl={seoMetadata?.og_image_url} title={item.title} />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm truncate leading-tight">{item.title}</CardTitle>
            <CardDescription className="text-xs mt-1 line-clamp-1">
              {item.book.book_name}
            </CardDescription>
            
            {/* Publishing Info */}
            <div className="mt-1 text-xs">
              {isActive && (
                <div className="text-success font-medium">📺 LIVE NOW</div>
              )}
              {isQueued && (
                <div className="text-muted-foreground">
                  {getPublishDayName(position as number)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export function SchedulePreview() {
  const navigate = useNavigate();
  const { data: scheduleItems, isLoading, error } = useDailyPublishedSchedule();
  
  // Preload schedule images for instant display
  useScheduleImagePreloader(scheduleItems);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">What's Next</h2>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !scheduleItems) {
    return (
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">What's Next</h2>
        <p className="text-sm text-muted-foreground">
          Unable to load schedule
        </p>
      </div>
    );
  }
  
  const activeItems = scheduleItems.filter(item => item.status === 'active') || [];
  const queuedItems = scheduleItems
    .filter(item => item.status === 'queued')
    .sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime())
    .slice(0, 4) || []; // Show only first 4 queued items
  
  const hasContent = activeItems.length > 0 || queuedItems.length > 0;
  
  if (!hasContent) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-lg font-semibold text-foreground">What's Next</h2>
        <p className="text-sm text-muted-foreground">
          No upcoming content scheduled yet
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/schedule')}
          className="gap-2"
        >
          <Calendar className="w-4 h-4" />
          View Full Schedule
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-1">What's Next</h2>
        <p className="text-xs text-muted-foreground">
          Upcoming books and current content
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-2">
          {/* Active Items */}
          {activeItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-success" />
                Currently Live
              </h3>
              <div className="space-y-2">
                {activeItems.map(item => (
                  <SchedulePreviewCard key={item.id} item={item} position="active" />
                ))}
              </div>
            </div>
          )}
          
          {/* Queued Items */}
          {queuedItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Coming Up Next
              </h3>
              <div className="space-y-2">
                {queuedItems.map((item, index) => (
                  <SchedulePreviewCard key={item.id} item={item} position={index + 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* View Full Schedule Button */}
      <div className="pt-2 border-t border-border/50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/schedule')}
          className="w-full gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View Full Schedule
        </Button>
      </div>
    </div>
  );
}