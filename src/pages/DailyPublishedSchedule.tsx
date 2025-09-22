import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDailyPublishedSchedule } from '@/hooks/useDailyPublishedSchedule';
import { useScheduleForDate } from '@/hooks/useScheduleForDate';
import { useExpireContent } from '@/hooks/useExpireContent';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { MetaHead } from '@/components/common/MetaHead';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, BookOpen, RefreshCw, GripVertical, Image } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { toast } from 'sonner';
import { 
  DndContext, 
  closestCenter, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable 
} from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Custom hook for date editing logic
function useDateEdit() {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');

  const startEdit = (itemId: string, currentDate: string) => {
    setEditingDate(itemId);
    setNewDate(currentDate);
  };

  const cancelEdit = () => {
    setEditingDate(null);
    setNewDate('');
  };

  const isEditing = (itemId: string) => editingDate === itemId;

  return {
    editingDate,
    newDate,
    setNewDate,
    startEdit,
    cancelEdit,
    isEditing
  };
}

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

// Comprehensive date/time formatter
const formatScheduleDate = (dateString: string, options?: { includeTime?: boolean; isStart?: boolean }) => {
  const date = new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  if (!options?.includeTime) {
    return date;
  }
  
  const time = options.isStart ? '7:01 AM ET' : '7:00 AM ET';
  return `${date} at ${time}`;
};

// Utility function to generate sequential publish dates
const getSequentialDates = (startDate: Date, count: number): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

export default function DailyPublishedScheduleSimple() {
  const { user } = useAuth();
  const { data: scheduleItems, isLoading, error } = useDailyPublishedSchedule();
  const scheduleForDate = useScheduleForDate();
  const expireContent = useExpireContent();
  const dateEdit = useDateEdit();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDateChange = async (itemId: string, publishDate: string) => {
    try {
      await scheduleForDate.mutateAsync({ 
        dailyPublishedId: itemId, 
        publishDate 
      });
      dateEdit.cancelEdit();
    } catch (error) {
      console.error('Failed to update date:', error);
    }
  };

  const handleExpireContent = async () => {
    try {
      await expireContent.mutateAsync();
    } catch (error) {
      console.error('Failed to expire content:', error);
    }
  };

  // Handle drag end for reordering queued items
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const queuedItems = scheduleItems?.filter(item => item.status === 'queued') || [];
    const oldIndex = queuedItems.findIndex(item => item.id === active.id);
    const newIndex = queuedItems.findIndex(item => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Reorder the items
    const reorderedItems = arrayMove(queuedItems, oldIndex, newIndex);
    
    // Calculate new sequential dates starting from tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const newDates = getSequentialDates(tomorrow, reorderedItems.length);
    
    // Update dates for all reordered items
    try {
      toast.loading('Reordering schedule...', { id: 'reorder' });
      
      await Promise.all(
        reorderedItems.map((item, index) =>
          scheduleForDate.mutateAsync({
            dailyPublishedId: item.id,
            publishDate: newDates[index]
          })
        )
      );
      
      toast.success('Schedule reordered successfully', { id: 'reorder' });
    } catch (error) {
      console.error('Failed to reorder schedule:', error);
      toast.error('Failed to reorder schedule', { id: 'reorder' });
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please sign in to view the publishing schedule.</p>
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading schedule...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading schedule: {error.message}</p>
        </div>
      </PageLayout>
    );
  }

  const activeItems = scheduleItems?.filter(item => item.status === 'active') || [];
  const queuedItems = scheduleItems?.filter(item => item.status === 'queued') || [];
  const expiredItems = scheduleItems?.filter(item => item.status === 'expired') || [];

  return (
    <>
      <MetaHead 
        metadata={{
          title: "Publishing Schedule",
          description: "Manage your daily published content schedule with date-based publishing",
          type: "website"
        }}
      />
      
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Publishing Schedule</h1>
              <p className="text-muted-foreground mt-2">
                Books are published daily at 7:01 AM Eastern Time. Schedule your content for specific dates.
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

          {/* Active Items */}
          {activeItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-500" />
                Currently Active
              </h2>
              <div className="space-y-4">
                {activeItems.map((item) => (
                  <ScheduleCard 
                    key={item.id} 
                    item={item} 
                    onDateEdit={(id, date) => handleDateChange(id, date)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Queued Items */}
          {queuedItems.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Scheduled ({queuedItems.length})
                <span className="text-sm text-muted-foreground font-normal ml-2">Drag to reorder</span>
              </h2>
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
                    {queuedItems.map((item) => (
                      <ScheduleCard 
                        key={item.id} 
                        item={item} 
                        onDateEdit={(id, date) => handleDateChange(id, date)}
                        isDraggable={true}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Empty State */}
          {(!scheduleItems || scheduleItems.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No scheduled content</h3>
                <p className="text-muted-foreground">
                  Create and publish books to see them in the schedule.
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
                  Show {expiredItems.length} expired items
                </summary>
                <div className="mt-4 space-y-2 opacity-60">
                  {expiredItems.map((item) => (
                    <div key={item.id} className="text-sm p-3 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>{item.title} • {item.book.book_name}</span>
                        <span className="text-xs">{formatScheduleDate(item.publish_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </PageLayout>
    </>
  );
}

// Reusable components
function ScheduleThumbnail({ imageUrl, title }: { imageUrl?: string; title: string }) {
  return (
    <div className="w-full md:w-48 h-32 md:h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <Image className="h-8 w-8 text-muted-foreground" />
      )}
    </div>
  );
}

function ScheduleDates({ 
  item, 
  onDateEdit, 
  dateEdit 
}: { 
  item: ScheduleCardItem; 
  onDateEdit: (id: string, date: string) => void;
  dateEdit: ReturnType<typeof useDateEdit>;
}) {
  const today = new Date().toISOString().split('T')[0];

  const handleDateSave = (newDate: string) => {
    onDateEdit(item.id, newDate);
    dateEdit.cancelEdit();
  };

  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>Starts {formatScheduleDate(item.publish_date, { includeTime: true, isStart: true })}</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {dateEdit.isEditing(item.id) ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Input
              type="date"
              value={dateEdit.newDate}
              onChange={(e) => dateEdit.setNewDate(e.target.value)}
              min={today}
              className="w-auto"
            />
            <Button
              size="sm"
              onClick={() => handleDateSave(dateEdit.newDate)}
              disabled={!dateEdit.newDate}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dateEdit.cancelEdit}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <span 
            className="cursor-pointer hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              dateEdit.startEdit(item.id, item.expires_at);
            }}
          >
            Expires {formatScheduleDate(item.expires_at, { includeTime: true, isStart: false })}
          </span>
        )}
      </div>
    </div>
  );
}

// Type for simplified schedule card props
type ScheduleCardItem = DailyPublishedWithBook;

interface ScheduleCardProps {
  item: ScheduleCardItem;
  onDateEdit: (id: string, date: string) => void;
  isDraggable?: boolean;
}

function ScheduleCard({ 
  item, 
  onDateEdit,
  isDraggable = false
}: ScheduleCardProps) {
  const navigate = useNavigate();
  const { data: seoMetadata } = useSeoMetadata(item.id);
  const dateEdit = useDateEdit();

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
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : {};

  const handleCardClick = () => {
    navigate(`/books/${item.book_id}`);
  };

  const cardContent = (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row gap-3 relative">
          {/* Conditional Drag Handle */}
          {isDraggable && (
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded absolute top-2 right-2 md:top-1/2 md:-translate-y-1/2 md:right-2 z-10"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Thumbnail Component */}
          <ScheduleThumbnail 
            imageUrl={seoMetadata?.og_image_url}
            title={item.title}
          />

          {/* Content */}
          <div className="md:flex-1 md:min-w-0">
            <div className="flex justify-between items-start">
              <div className={`flex-1 min-w-0 ${isDraggable ? 'pr-8 md:pr-0' : ''}`}>
                <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                <CardDescription className="mt-1">
                  {item.book.book_name}
                  {item.description && ` • ${item.description}`}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(item.status)} variant="secondary">
                {item.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Dates Component */}
            <ScheduleDates 
              item={item}
              onDateEdit={onDateEdit}
              dateEdit={dateEdit}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Always wrap with sortable div, but only apply ref and style when draggable
  return (
    <div ref={isDraggable ? setNodeRef : undefined} style={style}>
      {cardContent}
    </div>
  );
}
