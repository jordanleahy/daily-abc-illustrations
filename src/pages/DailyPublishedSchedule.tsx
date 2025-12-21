import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDailyPublishedQueue } from '@/hooks/useDailyPublishedQueue';
import { useExpireContent } from '@/hooks/useExpireContent';
import { useScheduleImagePreloader } from '@/hooks/useScheduleImagePreloader';
import { MetaHead } from '@/components/common/MetaHead';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, RefreshCw } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { DailyPublishedQueueCard } from '@/components/daily-published/DailyPublishedQueueCard';

export default function DailyPublishedSchedule() {
  const { user } = useAuthContext();
  const { data: scheduleItems, isLoading, error } = useDailyPublishedQueue();
  const expireContent = useExpireContent();

  // Preload schedule images for instant display
  useScheduleImagePreloader(scheduleItems);

  const handleRefresh = async () => {
    try {
      await expireContent.mutateAsync();
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  if (!user) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please sign in to view the publishing schedule.</p>
        </div>
      </StandardPageLayout>
    );
  }

  if (isLoading) {
    return (
      <StandardPageLayout>
        <LoadingState text="Loading schedule..." />
      </StandardPageLayout>
    );
  }

  if (error) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading schedule: {error.message}</p>
        </div>
      </StandardPageLayout>
    );
  }

  // Sort all items by publish_date (FIFO order)
  const allItems = (scheduleItems || []).sort((a, b) => 
    new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()
  );

  // Helper function to check if an item should be considered expired
  const isExpired = (item: typeof allItems[0]) => {
    const now = new Date();
    const publishDate = new Date(item.publish_date);
    const expiresAt = item.expires_at ? new Date(item.expires_at) : null;
    
    // Not expired if publish date is in the future (not yet published)
    if (publishDate > now) {
      return false;
    }
    
    // Expired if publish date has passed and expires_at has passed
    return expiresAt && now > expiresAt;
  };

  // Helper function to check if a queued item has a past publish date
  const isPastDue = (item: typeof allItems[0]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for fair comparison
    
    const publishDate = new Date(item.publish_date);
    publishDate.setHours(0, 0, 0, 0);
    
    // Item is past due if publish date is before today
    return publishDate < now;
  };

  // Filter items with client-side expiration detection
  const activeItems = allItems.filter(item => item.status === 'active' && !isExpired(item));
  
  // Queued items: only show items with FUTURE publish dates
  const queuedItems = allItems.filter(item => 
    item.status === 'queued' && !isExpired(item) && !isPastDue(item)
  );
  
  // Expired items: includes expired status, actually expired, AND past-due queued items
  const expiredItems = allItems.filter(item => 
    item.status === 'expired' || isExpired(item) || (item.status === 'queued' && isPastDue(item))
  );

  return (
    <>
      <MetaHead 
        metadata={{
          title: "Publishing Schedule - Daily Queue",
          description: "View your daily published content queue. Books publish automatically at 7:01 AM Eastern Time.",
          type: "website"
        }}
      />
      
      <StandardPageLayout containerSize="xl" containerClassName="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Publishing Queue</h1>
            <p className="text-muted-foreground mt-2">
              📚 Books publish daily at <strong>7:01 AM Eastern Time</strong><br/>
              📋 First In, First Out • New books added to end of queue
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={expireContent.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${expireContent.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Active Item */}
        {activeItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-500" />
              📺 Currently Live
            </h2>
            <div className="space-y-4">
              {activeItems.map((item) => (
                <DailyPublishedQueueCard 
                  key={item.id} 
                  item={item}
                  position="active"
                />
              ))}
            </div>
          </div>
        )}

        {/* Queued Items */}
        {queuedItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📅 Publishing Queue ({queuedItems.length})
            </h2>
            <div className="space-y-4">
              {queuedItems.map((item, index) => (
                <DailyPublishedQueueCard 
                  key={item.id} 
                  item={item}
                  position={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!scheduleItems || scheduleItems.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No books in queue</h3>
              <p className="text-muted-foreground">
                Publish books to see them in the daily schedule.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Expired Items (collapsible) */}
        {expiredItems.length > 0 && (
          <div className="mt-8">
            <details className="group" open>
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Show {expiredItems.length} expired items
              </summary>
              <div className="mt-4 space-y-4 opacity-60">
                {expiredItems.map((item) => (
                  <DailyPublishedQueueCard 
                    key={item.id} 
                    item={item}
                    position="expired"
                  />
                ))}
              </div>
            </details>
          </div>
        )}
      </StandardPageLayout>
    </>
  );
}
