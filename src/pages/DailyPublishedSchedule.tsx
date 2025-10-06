import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDailyPublishedSchedule } from '@/hooks/useDailyPublishedSchedule';
import { useReorderQueue } from '@/hooks/useReorderQueue';
import { useRequeueExpiredItem } from '@/hooks/useRequeueExpiredItem';
import { useExpireContent } from '@/hooks/useExpireContent';
import { useHasRole } from '@/hooks/useUserRole';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { useScheduleImagePreloader } from '@/hooks/useScheduleImagePreloader';
import { MetaHead } from '@/components/common/MetaHead';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Clock, BookOpen, RefreshCw, GripVertical, Image, ArrowUp, ArrowDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { toast } from 'sonner';
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable 
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { LoadingState } from '@/components/ui/loading-state';

// Utility functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success text-success-foreground';
    case 'queued': return 'bg-info text-info-foreground';
    case 'expired': return 'bg-muted text-muted-foreground';
    case 'draft': return 'bg-warning text-warning-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

// Simple date formatter - shows when it will be active (always 7:01 AM ET)
const formatScheduleDate = (dateString: string, options?: { includeTime?: boolean }) => {
  const date = new Date(dateString);
  
  if (!options?.includeTime) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Always show 7:01 AM ET since that's when all books publish
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }) + ' at 7:01 AM ET';
};

export default function DailyPublishedScheduleSimple() {
  const { user } = useAuth();
  const { data: scheduleItems, isLoading, error } = useDailyPublishedSchedule();
  const reorderQueue = useReorderQueue();
  const requeueItem = useRequeueExpiredItem();
  const expireContent = useExpireContent();
  const isAdmin = useHasRole('admin');

  // Preload schedule images for instant display
  useScheduleImagePreloader(scheduleItems);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleExpireContent = async () => {
    try {
      await expireContent.mutateAsync();
    } catch (error) {
      console.error('Failed to expire content:', error);
    }
  };

  // Handle drag end for reordering queued items and requeueing expired items
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const queuedItems = scheduleItems?.filter(i => i.status === 'queued')
      .sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()) || [];
    const expiredItems = scheduleItems?.filter(i => i.status === 'expired') || [];
    
    const draggedItem = [...queuedItems, ...expiredItems].find(item => item.id === active.id);
    if (!draggedItem) return;
    
    const isExpiredItem = draggedItem.status === 'expired';
    
    // Check admin permission for expired items
    if (isExpiredItem && !isAdmin) {
      toast.error('Only admins can requeue expired items');
      return;
    }
    
    // Handle requeueing expired item into queue
    if (isExpiredItem) {
      let overIndex = queuedItems.findIndex(item => item.id === over.id);
      
      // If dropped on the queue container itself (not on a specific card), add to end
      if (over.id === 'queue-drop-zone') {
        overIndex = 0; // Add to beginning when dropped on the queue zone
      } else if (overIndex === -1) {
        overIndex = queuedItems.length; // Add to end if no specific card found
      }
      
      // Insert at position
      const newQueue = [...queuedItems];
      newQueue.splice(overIndex, 0, draggedItem);
      
      // Calculate new dates for all items
      const today = new Date();
      const updates = newQueue.map((item, index) => {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + index + 1);
        return {
          id: item.id,
          publish_date: futureDate.toISOString().split('T')[0]
        };
      });
      
      toast.promise(
        (async () => {
          // First requeue the expired item
          const expiredUpdate = updates.find(u => u.id === draggedItem.id)!;
          await requeueItem.mutateAsync({ 
            id: expiredUpdate.id, 
            publish_date: expiredUpdate.publish_date 
          });
          
          // Then update other items
          const otherUpdates = updates.filter(u => u.id !== draggedItem.id);
          if (otherUpdates.length > 0) {
            await reorderQueue.mutateAsync({ items: otherUpdates });
          }
        })(),
        {
          loading: 'Requeueing item...',
          success: 'Item requeued successfully',
          error: 'Failed to requeue item'
        }
      );
      return;
    }
    
    // Normal reordering within queue
    let oldIndex = queuedItems.findIndex(item => item.id === active.id);
    let newIndex = queuedItems.findIndex(item => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reordered = arrayMove(queuedItems, oldIndex, newIndex);
    
    // Calculate new dates
    const today = new Date();
    const updates = reordered.map((item, index) => {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + index + 1);
      return {
        id: item.id,
        publish_date: futureDate.toISOString().split('T')[0]
      };
    });
    
    toast.promise(
      reorderQueue.mutateAsync({ items: updates }),
      {
        loading: 'Reordering queue...',
        success: 'Queue reordered successfully',
        error: 'Failed to reorder queue'
      }
    );
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

  const activeItems = scheduleItems?.filter(item => item.status === 'active') || [];
  const queuedItems = scheduleItems?.filter(item => item.status === 'queued')
    .sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()) || [];
  const expiredItems = scheduleItems?.filter(item => item.status === 'expired') || [];

  return (
    <>
      <MetaHead 
        metadata={{
          title: "Publishing Schedule - Simple Daily Queue",
          description: "Manage your daily published content queue. Books publish automatically at 7:01 AM Eastern Time.",
          type: "website"
        }}
      />
      
      <StandardPageLayout containerSize="xl" containerClassName="py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Publishing Queue</h1>
            <p className="text-muted-foreground mt-2">
              📚 Books publish daily at <strong>7:01 AM Eastern Time</strong><br/>
              📋 Drag to reorder • Next book publishes tomorrow
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExpireContent}
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
                <ScheduleCard 
                  key={item.id} 
                  item={item}
                  position="active"
                />
              ))}
            </div>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={[...queuedItems.map(item => item.id), ...(isAdmin ? expiredItems.map(item => item.id) : [])]}
            strategy={verticalListSortingStrategy}
          >
            {/* Queued Items */}
            {queuedItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  📅 Publishing Queue ({queuedItems.length})
                  <span className="text-sm text-muted-foreground font-normal ml-2">Drag to reorder</span>
                </h2>
                <QueueDropZone queueLength={queuedItems.length}>
                  <div className="space-y-4">
                    {queuedItems.map((item, index) => (
                      <ScheduleCard 
                        key={item.id} 
                        item={item}
                        position={index + 1}
                        isDraggable={true}
                      />
                    ))}
                  </div>
                </QueueDropZone>
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
                <details className="group" open={isAdmin}>
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Show {expiredItems.length} expired items
                    {isAdmin && <span className="text-xs opacity-75">(Drag to requeue)</span>}
                  </summary>
                  <div className={`mt-4 space-y-4 ${isAdmin ? '' : 'opacity-60'}`}>
                    {expiredItems.map((item) => (
                      <ScheduleCard 
                        key={item.id} 
                        item={item}
                        position="expired"
                        isDraggable={isAdmin}
                      />
                    ))}
                  </div>
                </details>
              </div>
            )}
          </SortableContext>
        </DndContext>
      </StandardPageLayout>
    </>
  );
}

// Reusable components
function QueueDropZone({ children, queueLength }: { children: React.ReactNode; queueLength: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'queue-drop-zone',
  });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`relative ${isOver ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
    >
      {children}
    </div>
  );
}

function ScheduleThumbnail({ imageUrl, title }: { imageUrl?: string; title: string }) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <AspectRatio ratio={16/9} className="bg-muted rounded-lg overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </AspectRatio>
    );
  }
  
  return (
    <div className="w-32 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <Image className="h-6 w-6 text-muted-foreground" />
      )}
    </div>
  );
}

// Type for simplified schedule card props
type ScheduleCardItem = DailyPublishedWithBook;

interface ScheduleCardProps {
  item: ScheduleCardItem;
  position: number | "active" | "expired";
  isDraggable?: boolean;
}

function ScheduleCard({ 
  item, 
  position,
  isDraggable = false
}: ScheduleCardProps) {
  const navigate = useNavigate();
  const { data: seoMetadata } = useSeoMetadata(item.id);
  const isMobile = useIsMobile();

  // Always call useSortable, but only apply effects when draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    disabled: !isDraggable
  });

  const style = isDraggable ? {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : {};

  const handleCardClick = () => {
    navigate(`/editor/${item.book_id}`);
  };

  const isActive = item.status === 'active';
  const isQueued = item.status === 'queued' && typeof position === 'number';
  const isExpired = item.status === 'expired';

  const cardContent = (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow group" onClick={handleCardClick}>
      <CardContent className="p-0">
        {isMobile ? (
          /* Mobile Layout: Full-width thumbnail on top */
          <div>
            {/* Full-width thumbnail */}
            <ScheduleThumbnail 
              imageUrl={seoMetadata?.og_image_url}
              title={item.title}
            />
            
            {/* Content section with publishing info above title */}
            <div className="p-6">
              {/* Publishing Info - Mobile (above title) */}
              <div className="mb-3 text-sm">
                {isActive && (
                  <>
                    <div className="text-green-600 font-semibold">📺 LIVE NOW</div>
                    <div className="text-muted-foreground text-xs">Until tomorrow 7:01 AM ET</div>
                  </>
                )}
                {isQueued && (
                  <>
                    <div className="text-blue-600">📅 Position #{position}</div>
                    <div className="text-muted-foreground text-xs">
                      Publishes {position === 1 ? 'Tomorrow' : `in ${position} days`} at 7:01 AM ET
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
              
              {/* Title and description */}
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.book.book_name}
                    {item.description && ` • ${item.description}`}
                  </CardDescription>
                </div>
                
                {/* Drag Handle - Mobile (right side) */}
                {isDraggable && (
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded ml-2"
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Layout: Horizontal with thumbnail on left */
          <div className="p-6">
            <div className="flex gap-3 items-center">
              {/* Conditional Drag Handle - Desktop */}
              {isDraggable && (
                <div
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                  {...attributes}
                  {...listeners}
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* Thumbnail */}
              <ScheduleThumbnail 
                imageUrl={seoMetadata?.og_image_url}
                title={item.title}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {item.book.book_name}
                    {item.description && ` • ${item.description}`}
                  </CardDescription>
                </div>
                
                {/* Publishing Info - Desktop (below title) */}
                <div className="mt-2 text-sm">
                  {isActive && (
                    <>
                      <div className="text-green-600 font-semibold">📺 LIVE NOW</div>
                      <div className="text-muted-foreground text-xs">Until tomorrow 7:01 AM ET</div>
                    </>
                  )}
                  {isQueued && (
                    <>
                      <div className="text-blue-600">📅 Position #{position}</div>
                      <div className="text-muted-foreground text-xs">
                        Publishes {position === 1 ? 'Tomorrow' : `in ${position} days`} at 7:01 AM ET
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
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isDraggable) {
    return (
      <div ref={setNodeRef} style={style}>
        {cardContent}
      </div>
    );
  }

  return cardContent;
}