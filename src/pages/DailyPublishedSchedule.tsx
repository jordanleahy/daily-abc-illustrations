import { PageLayout } from '@/components/layout/PageLayout';
import { MetaHead } from '@/components/common/MetaHead';
import { useDailyPublishedQueue } from '@/hooks/useDailyPublishedQueue';
import { DailyPublishedQueueCard } from '@/components/daily-published/DailyPublishedQueueCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DailyPublishedWithBook } from '@/types/dailyPublished';

const DailyPublishedSchedule = () => {
  const { data: queueItems, isLoading, error } = useDailyPublishedQueue();

  const calculateExpectedActivationTime = (item: DailyPublishedWithBook, index: number) => {
    if (item.status === 'active') {
      return undefined; // Active items don't need activation time
    }
    
    if (item.status === 'queued' && queueItems) {
      // Find the current active item
      const activeItem = queueItems.find(queueItem => queueItem.status === 'active');
      let baseTime: Date;

      console.log('Debug activation time calculation:', {
        itemTitle: item.title,
        index,
        activeItem: activeItem ? {
          title: activeItem.title,
          published_at: activeItem.published_at,
          expires_at: activeItem.expires_at
        } : null
      });

      if (activeItem && activeItem.expires_at) {
        // Use expires_at directly instead of calculating from published_at
        baseTime = new Date(activeItem.expires_at);
        console.log('Using expires_at:', activeItem.expires_at, 'baseTime:', baseTime);
      } else if (activeItem && activeItem.published_at) {
        // Fallback: Calculate from published_at + 24 hours
        const publishedDate = new Date(activeItem.published_at);
        console.log('Published date:', publishedDate, 'isValid:', !isNaN(publishedDate.getTime()));
        
        if (isNaN(publishedDate.getTime())) {
          console.error('Invalid published_at date:', activeItem.published_at);
          return undefined;
        }
        
        baseTime = new Date(publishedDate);
        baseTime.setHours(baseTime.getHours() + 24);
        console.log('Calculated baseTime from published_at:', baseTime);
      } else {
        // If no active item, start from now
        baseTime = new Date();
        console.log('No active item, using now:', baseTime);
      }

      // Calculate how many positions ahead this item is from becoming active
      const activeItemIndex = queueItems.findIndex(queueItem => queueItem.status === 'active');
      const positionsAhead = index - (activeItemIndex >= 0 ? activeItemIndex : 0) - 1;

      console.log('Position calculation:', {
        activeItemIndex,
        currentIndex: index,
        positionsAhead
      });

      // Each position adds 24 hours
      const activationTime = new Date(baseTime);
      
      if (isNaN(baseTime.getTime())) {
        console.error('Invalid baseTime:', baseTime);
        return undefined;
      }
      
      activationTime.setHours(activationTime.getHours() + (positionsAhead * 24));
      
      console.log('Final activation time:', activationTime, 'isValid:', !isNaN(activationTime.getTime()));
      
      if (isNaN(activationTime.getTime())) {
        console.error('Invalid activation time calculated');
        return undefined;
      }

      return activationTime.toISOString();
    }
    
    return undefined;
  };

  return (
    <>
      <MetaHead 
        metadata={{
          title: "Daily Published Schedule",
          description: "View and manage the daily published content schedule"
        }}
      />
      <PageLayout title="Daily Published Schedule">
        <div className="container mx-auto py-6">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Publishing Queue</h1>
              </div>
              <p className="text-muted-foreground">
                Books are automatically published every 24 hours in queue order
              </p>
            </div>

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load the publishing queue. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            )}

            {/* Queue Items */}
            {!isLoading && !error && (
              <div className="space-y-4">
                {queueItems?.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items in queue</h3>
                    <p className="text-muted-foreground">
                      Add books to your daily published queue to get started.
                    </p>
                  </div>
                 ) : (
                   queueItems?.map((item, index) => (
                     <DailyPublishedQueueCard
                       key={item.id}
                       item={item}
                       position={index + 1}
                       expectedActivationTime={calculateExpectedActivationTime(item, index)}
                     />
                   ))
                 )}
              </div>
            )}
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default DailyPublishedSchedule;