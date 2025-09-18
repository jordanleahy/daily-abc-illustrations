import { PageLayout } from '@/components/layout/PageLayout';
import { MetaHead } from '@/components/common/MetaHead';
import { useDailyPublishedQueue } from '@/hooks/useDailyPublishedQueue';
import { DailyPublishedQueueCard } from '@/components/daily-published/DailyPublishedQueueCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DailyPublishedSchedule = () => {
  const { data: queueItems, isLoading, error } = useDailyPublishedQueue();

  const calculateExpectedActivationTime = (queuePosition: number) => {
    if (queuePosition === 1) {
      // First item - check if there's currently an active item
      const activeItem = queueItems?.find(item => item.status === 'active');
      if (!activeItem) {
        return new Date().toISOString(); // Can activate now
      }
      return activeItem.expires_at; // Wait for current to expire
    }
    
    // For items after the first, calculate based on 48-hour intervals
    const activeItem = queueItems?.find(item => item.status === 'active');
    const baseTime = activeItem ? activeItem.published_at : new Date().toISOString();
    const activationTime = new Date(baseTime);
    activationTime.setHours(activationTime.getHours() + (queuePosition - 1) * 48);
    return activationTime.toISOString();
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
                Books are automatically published every 48 hours in queue order
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
                  queueItems?.map((item) => (
                    <DailyPublishedQueueCard
                      key={item.id}
                      item={item}
                      expectedActivationTime={
                        item.status === 'queued' 
                          ? calculateExpectedActivationTime(item.queue_position)
                          : undefined
                      }
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