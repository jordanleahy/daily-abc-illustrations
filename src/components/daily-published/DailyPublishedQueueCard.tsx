import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeRemaining, formatFixedScheduleTime } from '@/utils/timeUtils';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';

import { Clock, Calendar, Hash, Image, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DailyPublishedQueueCardProps {
  item: DailyPublishedWithBook;
  position: number;
  expectedActivationTime?: string;
  isDraggable?: boolean;
}

export function DailyPublishedQueueCard({ 
  item, 
  position,
  expectedActivationTime,
  isDraggable = false
}: DailyPublishedQueueCardProps) {
  const navigate = useNavigate();
  
  // Check if item is expired (client-side detection)
  const isExpiredClientSide = item.expires_at && new Date() > new Date(item.expires_at);
  const effectiveStatus = isExpiredClientSide && item.status !== 'expired' ? 'expired' : item.status;
  
  // Fetch SEO metadata for this specific daily published item
  const { data: seoMetadata } = useSeoMetadata(item.id);

  // Sortable functionality (only for draggable items)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: item.id,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleCardClick = () => {
    navigate(`/editor/${item.book_id}`);
  };
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'queued':
        return 'secondary';
      case 'expired':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'queued':
        return 'text-blue-600';
      case 'expired':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  const getTimingDisplay = () => {
    if (effectiveStatus === 'active') {
      return {
        icon: Clock,
        label: 'Expires',
        value: formatTimeRemaining(item.expires_at),
        color: 'text-red-600'
      };
    }
    
    if (effectiveStatus === 'queued' && expectedActivationTime) {
      return {
        icon: Calendar,
        label: 'Scheduled to activate',
        value: formatFixedScheduleTime(expectedActivationTime),
        color: 'text-blue-600'
      };
    }
    
    if (effectiveStatus === 'expired') {
      return {
        icon: Calendar,
        label: 'Expired',
        value: item.expires_at ? new Date(item.expires_at).toLocaleDateString() : 'Recently expired',
        color: 'text-gray-500'
      };
    }

    return null;
  };

  const timingInfo = getTimingDisplay();

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50' : ''}`}
    >
      <Card 
        className={`overflow-hidden border-l-4 border-l-primary/20 hover:border-l-primary/50 transition-colors cursor-pointer hover:shadow-lg ${
          isDraggable ? 'relative' : ''
        }`}
        onClick={handleCardClick}
      >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Drag Handle (only for draggable items) */}
          {isDraggable && (
            <div 
              className="flex-shrink-0 p-2 cursor-grab hover:bg-muted rounded-md transition-colors"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          {/* SEO Thumbnail Image */}
          <div className="flex-shrink-0 w-32 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {seoMetadata?.og_image_url ? (
              <img 
                src={seoMetadata.og_image_url} 
                alt={`${item.title} preview`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <Image className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
               <span className="text-sm font-medium text-muted-foreground">
                 Position {position}
               </span>
               <Badge variant={getStatusVariant(effectiveStatus)} className="flex-shrink-0">
                 {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                 {isExpiredClientSide && item.status !== 'expired' && (
                   <span className="ml-1 text-xs">(pending update)</span>
                 )}
               </Badge>
            </div>
            
            <h3 className="text-xl font-bold text-foreground leading-tight mb-1">
              {seoMetadata?.seo_title || item.title || "Unknown Title"}
            </h3>
            
            {seoMetadata?.seo_description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-2">
                {seoMetadata.seo_description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          {timingInfo && (
            <div className="flex items-center gap-2">
              <timingInfo.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {timingInfo.label}:
              </span>
              <span className={`text-sm font-medium ${timingInfo.color}`}>
                {timingInfo.value}
              </span>
            </div>
          )}
          
          {effectiveStatus === 'active' && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Published</div>
              <div className="text-sm font-medium">
                {new Date(item.published_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}