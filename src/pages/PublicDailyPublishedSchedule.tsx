import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePublicDailyPublishedSchedule } from '@/hooks/usePublicDailyPublishedSchedule';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { MetaHead } from '@/components/common/MetaHead';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Image } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { format } from 'date-fns';

// Utility functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'queued':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'expired':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatScheduleDate = (dateString: string, options?: { includeTime?: boolean; isStart?: boolean }) => {
  const date = new Date(dateString);
  
  if (options?.includeTime) {
    return format(date, options.isStart ? "MMM d 'at' h:mm a" : "MMM d 'at' h:mm a");
  }
  
  return format(date, 'MMM d, yyyy');
};

const PublicDailyPublishedSchedule: React.FC = () => {
  const { data: scheduleItems, isLoading, error } = usePublicDailyPublishedSchedule();
  const navigate = useNavigate();

  const activeItems = scheduleItems?.filter(item => item.status === 'active') || [];
  const queuedItems = scheduleItems?.filter(item => item.status === 'queued') || [];

  if (isLoading) {
    return (
      <PageLayout>
        <MetaHead 
          metadata={{
            title: "Daily Published Schedule - Public",
            description: "View the current schedule of published content"
          }}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <MetaHead 
          metadata={{
            title: "Daily Published Schedule - Public",
            description: "View the current schedule of published content"
          }}
        />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2 text-destructive">Failed to load schedule</h3>
              <p className="text-muted-foreground">
                Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <MetaHead 
        metadata={{
          title: "Daily Published Schedule - Public",
          description: "View the current schedule of published content"
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Published Content Schedule</h1>
          <p className="text-muted-foreground">
            Currently active and upcoming scheduled content
          </p>
        </div>

        <div className="space-y-8">
          {/* Active Items */}
          {activeItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                Currently Active ({activeItems.length})
              </h2>
              <div className="space-y-4">
                {activeItems.map((item) => (
                  <PublicScheduleCard 
                    key={item.id} 
                    item={item}
                    onClick={() => navigate(`/book/${item.book_id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Queued Items */}
          {queuedItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                Scheduled ({queuedItems.length})
              </h2>
              <div className="space-y-4">
                {queuedItems.map((item) => (
                  <PublicScheduleCard 
                    key={item.id} 
                    item={item}
                    onClick={() => navigate(`/book/${item.book_id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!scheduleItems || scheduleItems.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scheduled content</h3>
                <p className="text-muted-foreground">
                  Check back later for new published content.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

// Reusable components
const PublicScheduleThumbnail: React.FC<{
  imageUrl?: string;
  title: string;
}> = ({ imageUrl, title }) => {
  return (
    <div className="h-full aspect-[1.91/1] bg-muted rounded-lg flex-shrink-0 overflow-hidden">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Image className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

const PublicScheduleDates: React.FC<{
  item: DailyPublishedWithBook;
}> = ({ item }) => {
  const isQueued = item.status === 'queued';
  
  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>
          {isQueued 
            ? `Scheduled for ${formatScheduleDate(item.publish_date, { includeTime: true, isStart: true })}`
            : `Published ${formatScheduleDate(item.publish_date, { includeTime: true, isStart: true })}`
          }
        </span>
      </div>
      {item.expires_at && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Expires {formatScheduleDate(item.expires_at, { includeTime: true })}</span>
        </div>
      )}
    </div>
  );
};

const PublicScheduleCard: React.FC<{
  item: DailyPublishedWithBook;
  onClick: () => void;
}> = ({ item, onClick }) => {
  const { data: seoMetadata } = useSeoMetadata(item.id);

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          {/* Thumbnail Component */}
          <PublicScheduleThumbnail 
            imageUrl={seoMetadata?.og_image_url}
            title={item.title}
          />

          {/* Content */}
          <div className="md:flex-1 md:min-w-0">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-0">
              <Badge className={`${getStatusColor(item.status)} self-start md:order-2`} variant="secondary">
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Badge>
              <div className="flex-1 min-w-0 md:order-1">
                <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                <CardDescription className="mt-1">
                  {item.book.book_name}
                  {item.description && ` • ${item.description}`}
                </CardDescription>
                
                {/* Dates Component */}
                <div className="mt-3">
                  <PublicScheduleDates item={item} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default PublicDailyPublishedSchedule;