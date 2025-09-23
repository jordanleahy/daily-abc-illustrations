import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { MetaHead } from '@/components/common/MetaHead';
import { UserHeader } from '@/components/layout/UserHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Clock, BookOpen, Image } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { toEasternTime } from '@/utils/timezone';
import { format } from 'date-fns-tz';

// Utility functions (reused from Schedule)
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-success text-success-foreground';
    case 'queued':
      return 'bg-info text-info-foreground';
    case 'expired':
      return 'bg-muted text-muted-foreground';
    case 'draft':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

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

export default function Library() {
  const {
    data: libraryItems,
    isLoading,
    error
  } = useLibraryBooks();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader 
          title="Library"
          showQRCode={false}
        />
        <div className="pt-16 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <UserHeader 
          title="Library"
          showQRCode={false}
        />
        <div className="pt-16 text-center py-8">
          <p className="text-destructive">Error loading library: {error.message}</p>
        </div>
      </div>
    );
  }

  const activeItems = libraryItems?.filter(item => item.status === 'active') || [];
  const queuedItems = libraryItems?.filter(item => item.status === 'queued').sort((a, b) => (a.queue_order || 0) - (b.queue_order || 0)) || [];
  const expiredItems = libraryItems?.filter(item => item.status === 'expired') || [];

  return <>
    <MetaHead metadata={{
      title: "My Library - Daily ABC Illustrations",
      description: "Browse your personal library of ABC illustration books. Discover daily published educational content for children.",
      type: "website"
    }} />
    
    <div className="min-h-screen bg-background">
      <UserHeader 
        title="Library"
        bookId={activeItems[0]?.book_id}
        showQRCode={true}
      />
      <div className="pt-16 container mx-auto px-4 pb-8 max-w-4xl">
        <div className="mb-8">
          
          
        </div>

        {/* Active Item */}
        {activeItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              📺 Currently Live
            </h2>
            <div className="space-y-4">
              {activeItems.map(item => (
                <PublicScheduleCard key={item.id} item={item} position="active" />
              ))}
            </div>
          </div>
        )}

        {/* Queued Items */}
        {queuedItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📅 Upcoming Books ({queuedItems.length})
            </h2>
            <div className="space-y-4">
              {queuedItems.map((item, index) => (
                <PublicScheduleCard key={item.id} item={item} position={index + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!libraryItems || libraryItems.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No books in library</h3>
              <p className="text-muted-foreground">
                Check back soon for new daily illustrations!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Expired Items (collapsible) */}
        {expiredItems.length > 0 && (
          <div className="mt-8">
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Show {expiredItems.length} past books
              </summary>
              <div className="mt-4 space-y-4 opacity-60">
                {expiredItems.map(item => (
                  <PublicScheduleCard 
                    key={item.id} 
                    item={item}
                    position="expired"
                  />
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  </>;
}

// Reusable components (adapted from Schedule)
function ScheduleThumbnail({
  imageUrl,
  title
}: {
  imageUrl?: string;
  title: string;
}) {
  return <>
    {/* Mobile: Full width with aspect ratio */}
    <div className="md:hidden w-full">
      <AspectRatio ratio={1.91} className="rounded-lg overflow-hidden bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </AspectRatio>
    </div>
    
    {/* Desktop: Fixed size */}
    <div className="hidden md:block w-32 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
      ) : (
        <Image className="h-6 w-6 text-muted-foreground" />
      )}
    </div>
  </>;
}

type ScheduleCardItem = DailyPublishedWithBook;

interface PublicScheduleCardProps {
  item: ScheduleCardItem;
  position: number | "active" | "expired";
}

function PublicScheduleCard({
  item,
  position
}: PublicScheduleCardProps) {
  const navigate = useNavigate();
  const {
    data: seoMetadata
  } = useSeoMetadata(item.id);

  const handleCardClick = () => {
    if (item.status === 'active') {
      navigate(`/library/${item.id}`);
    }
  };

  const isActive = item.status === 'active';
  const isQueued = item.status === 'queued' && typeof position === 'number';
  const isExpired = position === "expired";

  return <Card 
    className={`transition-shadow group ${isActive ? "cursor-pointer hover:shadow-lg" : ""}`} 
    onClick={isActive ? handleCardClick : undefined}
  >
    <CardHeader className="pb-3">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        {/* Thumbnail */}
        <ScheduleThumbnail imageUrl={seoMetadata?.og_image_url} title={item.title} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Publishing Info - Mobile Only (above title) */}
          <div className="block md:hidden mb-2 text-sm">
            {isActive && (
              <>
                <div className="text-green-600 font-semibold">📺 LIVE NOW</div>
                <div className="text-muted-foreground text-xs">Until tomorrow 7:01 AM ET</div>
              </>
            )}
            {isQueued && (
              <>
                <div className="text-muted-foreground text-xs">
                  {getPublishDayName(position as number)}
                </div>
              </>
            )}
            {isExpired && (
              <>
                <div className="text-muted-foreground font-semibold">⏰ EXPIRED</div>
                <div className="text-muted-foreground text-xs">
                  Published {formatScheduleDate(item.publish_date)}
                </div>
              </>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{item.title}</CardTitle>
            <CardDescription className="mt-1">
              {item.book.book_name}
              {item.description && ` • ${item.description}`}
            </CardDescription>
          </div>
          
          {/* Publishing Info - Desktop Only (below title) */}
          <div className="hidden md:block mt-2 text-sm">
            {isActive && (
              <>
                <div className="text-green-600 font-semibold">📺 LIVE NOW</div>
                <div className="text-muted-foreground text-xs">Until tomorrow 7:01 AM ET</div>
              </>
            )}
            {isQueued && (
              <>
                <div className="text-muted-foreground text-xs">
                  {getPublishDayName(position as number)}
                </div>
              </>
            )}
            {isExpired && (
              <>
                <div className="text-muted-foreground font-semibold">⏰ EXPIRED</div>
                <div className="text-muted-foreground text-xs">
                  Published {formatScheduleDate(item.publish_date)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
  </Card>;
}