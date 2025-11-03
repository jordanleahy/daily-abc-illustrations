import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyPublishedSchedule } from '@/hooks/useDailyPublishedSchedule';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { MetaHead } from '@/components/common/MetaHead';
import { FreemiumHeader } from '@/components/daily-published/FreemiumHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Clock, BookOpen, Image } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { toEasternTime } from '@/utils/timezone';
import { format } from 'date-fns-tz';
import { PremiumGate } from '@/components/subscription/PremiumGate';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

// Utility functions (reused from DailyPublishedSchedule)
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
export default function Schedule() {
  const {
    data: scheduleItems,
    isLoading,
    error
  } = useDailyPublishedSchedule();
  const { hasActiveSubscription } = useSubscription();
  const { hasLibraryAccess } = useFeatureAccess();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <FreemiumHeader 
          title="Schedule"
          bookId=""
          showQRCode={false}
        />
        <div className="pt-16 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading schedule...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <FreemiumHeader 
          title="Schedule"
          bookId=""
          showQRCode={false}
        />
        <div className="pt-16 text-center py-8">
          <p className="text-destructive">Error loading schedule: {error.message}</p>
        </div>
      </div>
    );
  }
  const activeItems = scheduleItems?.filter(item => item.status === 'active') || [];
  const queuedItems = scheduleItems?.filter(item => item.status === 'queued').sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()) || [];
  const expiredItems = scheduleItems?.filter(item => item.status === 'expired') || [];
  return <>
      <MetaHead metadata={{
      title: "Daily ABC Illustrations - Publishing Schedule",
      description: "View the daily publishing schedule for ABC illustration books. New books publish every day at 7:01 AM Eastern Time.",
      type: "website"
    }} />
      
      <div className="min-h-screen bg-background">
        <FreemiumHeader 
          title="Schedule"
          bookId={activeItems[0]?.book_id}
          showQRCode={true}
        />
        <div className="pt-16 container mx-auto px-4 pb-8 max-w-4xl">
          <div className="mb-8">
            
            
          </div>

          {/* Active Item */}
          {activeItems.length > 0 && <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-500" />
                📺 Currently Live
              </h2>
              <div className="space-y-4">
                {activeItems.map(item => <PublicScheduleCard key={item.id} item={item} position="active" />)}
              </div>
            </div>}

          {/* Queued Items */}
          {queuedItems.length > 0 && <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                📅 Upcoming Books ({queuedItems.length})
              </h2>
              <div className="space-y-4">
                {queuedItems.map((item, index) => <PublicScheduleCard key={item.id} item={item} position={index + 1} />)}
              </div>
            </div>}

          {/* Empty State - accessible to all users (free tier includes library access) */}
          {(!scheduleItems || scheduleItems.length === 0) && <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No books scheduled</h3>
                <p className="text-muted-foreground">
                  Check back soon for new daily illustrations!
                </p>
              </CardContent>
            </Card>}

          {/* Expired Items (Plus-tier only - past books archive) */}
          {expiredItems.length > 0 && (
            <div className="mt-8">
              {hasActiveSubscription ? (
                <details className="group" open>
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
              ) : (
                <PremiumGate 
                  feature="past books archive"
                  description="Upgrade to Plus to access all past daily published ABC books and view the complete archive."
                  showUpgrade={true}
                >
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Show {expiredItems.length} past books (Plus only)
                    </summary>
                  </details>
                </PremiumGate>
              )}
            </div>
          )}
        </div>
      </div>
    </>;
}

// Reusable components (adapted from DailyPublishedSchedule)
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
        <AspectRatio ratio={16/9} className="rounded-lg overflow-hidden bg-muted">
          {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>}
        </AspectRatio>
      </div>
      
      {/* Desktop: Fixed size */}
      <div className="hidden md:block w-32 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
        {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" /> : <Image className="h-6 w-6 text-muted-foreground" />}
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
    navigate(`/daily-published/${item.id}`);
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
              {isActive && <>
                  <div className="text-green-600 font-semibold">📺 LIVE NOW</div>
                  <div className="text-muted-foreground text-xs">Until tomorrow 7:01 AM ET</div>
                </>}
              {isQueued && <>
                  <div className="text-muted-foreground text-xs">
                    {getPublishDayName(position as number)}
                  </div>
                </>}
              {isExpired && <>
                  <div className="text-muted-foreground font-semibold">⏰ EXPIRED</div>
                  <div className="text-muted-foreground text-xs">
                    Published {formatScheduleDate(item.publish_date)}
                  </div>
                </>}
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
              {isActive && <>
                  <div className="text-green-600 font-semibold">📺 LIVE NOW</div>
                  <div className="text-muted-foreground text-xs">Until tomorrow 7:01 AM ET</div>
                </>}
              {isQueued && <>
                  <div className="text-muted-foreground text-xs">
                    {getPublishDayName(position as number)}
                  </div>
                </>}
              {isExpired && <>
                  <div className="text-muted-foreground font-semibold">⏰ EXPIRED</div>
                  <div className="text-muted-foreground text-xs">
                    Published {formatScheduleDate(item.publish_date)}
                  </div>
                </>}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>;
}