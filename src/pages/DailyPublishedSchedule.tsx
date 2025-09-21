import { PageLayout } from '@/components/layout/PageLayout';
import { MetaHead } from '@/components/common/MetaHead';
import { useDailyPublishedQueue } from '@/hooks/useDailyPublishedQueue';
import { useReorderQueue } from '@/hooks/useReorderQueue';
import { useExpireContent } from '@/hooks/useExpireContent';
import { DailyPublishedQueueCard } from '@/components/daily-published/DailyPublishedQueueCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useState, useMemo, useEffect } from 'react';

const DailyPublishedSchedule = () => {
  const { data: queueItems, isLoading, error } = useDailyPublishedQueue();
  const reorderMutation = useReorderQueue();
  const expireMutation = useExpireContent();
  
  // Local state for optimistic updates during drag
  const [optimisticItems, setOptimisticItems] = useState<DailyPublishedWithBook[] | undefined>(undefined);
  
  // Auto-expire content on component mount and periodically
  useEffect(() => {
    // Check for expired content when the component mounts
    expireMutation.mutate();
    
    // Set up periodic checks every 2 minutes
    const interval = setInterval(() => {
      expireMutation.mutate();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Use optimistic items if available, fallback to actual data
  const displayItems = optimisticItems || queueItems;
  
  // Separate items by status for proper rendering
  const { queuedItems, nonQueuedItems } = useMemo(() => {
    if (!displayItems) return { queuedItems: [], nonQueuedItems: [] };
    
    const queued = displayItems.filter(item => item.status === 'queued').sort((a, b) => a.queue_position - b.queue_position);
    const nonQueued = displayItems.filter(item => item.status !== 'queued');
    
    return { queuedItems: queued, nonQueuedItems: nonQueued };
  }, [displayItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = queuedItems.findIndex(item => item.id === active.id);
    const newIndex = queuedItems.findIndex(item => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically update the UI
    const reorderedQueued = arrayMove(queuedItems, oldIndex, newIndex);
    const allItems = [...nonQueuedItems, ...reorderedQueued];
    setOptimisticItems(allItems);

    // Prepare the reorder data with new queue positions
    const reorderData = reorderedQueued.map((item, index) => ({
      id: item.id,
      newPosition: index + 1
    }));

    // Execute the mutation
    reorderMutation.mutate(reorderData, {
      onError: () => {
        // Rollback optimistic update on error
        setOptimisticItems(undefined);
      },
      onSuccess: () => {
        // Clear optimistic state once server data is refetched
        setOptimisticItems(undefined);
      }
    });
  };

  const calculateExpectedActivationTime = (item: DailyPublishedWithBook) => {
    if (item.status === 'active') {
      return undefined; // Active items don't need activation time
    }
    
    if (item.status === 'queued') {
      // For fixed schedule, use the published_at time that was set by the migration
      // This represents the exact 11:12 PM UTC activation time for this item
      return item.published_at;
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
                Books are automatically published daily at 11:12 PM UTC in queue order
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
              <div className="space-y-6">
                {displayItems?.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items in queue</h3>
                    <p className="text-muted-foreground">
                      Add books to your daily published queue to get started.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Non-queued items (active, expired) */}
                    {nonQueuedItems.length > 0 && (
                      <div className="space-y-4">
                        {nonQueuedItems.map((item, index) => (
                          <DailyPublishedQueueCard
                            key={item.id}
                            item={item}
                            position={item.queue_position || index + 1}
                            expectedActivationTime={calculateExpectedActivationTime(item)}
                            isDraggable={false}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Draggable queued items */}
                    {queuedItems.length > 0 && (
                      <div className="space-y-4">
                        {queuedItems.length > 1 && (
                          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            💡 <strong>Tip:</strong> Drag and drop queued items to reorder them in the publishing schedule
                          </div>
                        )}
                        
                        <DndContext 
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext 
                            items={queuedItems.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-4">
                              {queuedItems.map((item, index) => (
                                <DailyPublishedQueueCard
                                  key={item.id}
                                  item={item}
                                  position={index + 1}
                                  expectedActivationTime={calculateExpectedActivationTime(item)}
                                  isDraggable={true}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </>
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