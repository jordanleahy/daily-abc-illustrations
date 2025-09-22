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
import { Label } from '@/components/ui/label';
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
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>('');

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
      setEditingDate(null);
      setNewDate('');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'queued': return 'bg-blue-500';
      case 'expired': return 'bg-gray-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                    editingDate={editingDate}
                    setEditingDate={setEditingDate}
                    newDate={newDate}
                    setNewDate={setNewDate}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
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
                      <DraggableScheduleCard 
                        key={item.id} 
                        item={item} 
                        onDateEdit={(id, date) => handleDateChange(id, date)}
                        editingDate={editingDate}
                        setEditingDate={setEditingDate}
                        newDate={newDate}
                        setNewDate={setNewDate}
                        formatDate={formatDate}
                        getStatusColor={getStatusColor}
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
                        <span className="text-xs">{formatDate(item.publish_date)}</span>
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

interface ScheduleCardProps {
  item: DailyPublishedWithBook;
  onDateEdit: (id: string, date: string) => void;
  editingDate: string | null;
  setEditingDate: (id: string | null) => void;
  newDate: string;
  setNewDate: (date: string) => void;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

function ScheduleCard({ 
  item, 
  onDateEdit, 
  editingDate, 
  setEditingDate, 
  newDate, 
  setNewDate, 
  formatDate, 
  getStatusColor 
}: ScheduleCardProps) {
  const navigate = useNavigate();
  const { data: seoMetadata } = useSeoMetadata(item.id);
  const isEditing = editingDate === item.id;
  const today = new Date().toISOString().split('T')[0];

  const handleCardClick = () => {
    navigate(`/books/${item.book_id}`);
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          {/* Thumbnail */}
          <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            {seoMetadata?.og_image_url ? (
              <img 
                src={seoMetadata.og_image_url} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {isEditing ? (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={today}
                    className="w-auto"
                  />
                  <Button
                    size="sm"
                    onClick={() => onDateEdit(item.id, newDate)}
                    disabled={!newDate}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingDate(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <span 
                  className="cursor-pointer hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingDate(item.id);
                    setNewDate(item.expires_at);
                  }}
                >
                  Expires on {formatDate(item.expires_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Draggable version of ScheduleCard for queued items
function DraggableScheduleCard(props: ScheduleCardProps) {
  const navigate = useNavigate();
  const { data: seoMetadata } = useSeoMetadata(props.item.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/books/${props.item.book_id}`)}>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 relative">
            {/* Drag Handle */}
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded absolute top-0 right-0 z-10"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Thumbnail */}
            <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              {seoMetadata?.og_image_url ? (
                <img 
                  src={seoMetadata.og_image_url} 
                  alt={props.item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{props.item.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {props.item.book.book_name}
                    {props.item.description && ` • ${props.item.description}`}
                  </CardDescription>
                </div>
                <Badge className={props.getStatusColor(props.item.status)} variant="secondary">
                  {props.item.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {props.editingDate === props.item.id ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="date"
                      value={props.newDate}
                      onChange={(e) => props.setNewDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-auto"
                    />
                    <Button
                      size="sm"
                      onClick={() => props.onDateEdit(props.item.id, props.newDate)}
                      disabled={!props.newDate}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => props.setEditingDate(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <span 
                    className="cursor-pointer hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.setEditingDate(props.item.id);
                      props.setNewDate(props.item.expires_at);
                    }}
                  >
                    Expires on {props.formatDate(props.item.expires_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}