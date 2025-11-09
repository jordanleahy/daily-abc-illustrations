import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookImage } from '@/components/ui/book-image';
import { formatTimeRemaining, formatFixedScheduleTime } from '@/utils/timeUtils';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { useDeleteDailyPublished } from '@/hooks/useDeleteDailyPublished';
import { useUserRole } from '@/hooks/useUserRole';
import { Clock, Calendar, Hash, Image, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface DailyPublishedQueueCardProps {
  item: DailyPublishedWithBook;
  position: number | "active" | "expired";
  expectedActivationTime?: string;
}
export function DailyPublishedQueueCard({
  item,
  position,
  expectedActivationTime
}: DailyPublishedQueueCardProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteDailyPublished();
  const { data: userRole } = useUserRole();

  // Format publish date in user's local timezone
  const formatPublishDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if item is expired (client-side detection)
  const isExpiredClientSide = item.expires_at && new Date() > new Date(item.expires_at);
  const effectiveStatus = isExpiredClientSide && item.status !== 'expired' ? 'expired' : item.status;

  // Fetch SEO metadata for this specific daily published item
  const {
    data: seoMetadata
  } = useSeoMetadata(item.id);

  // Show lock icon for premium-gated content (but not for admins/teachers)
  const hasFullAccess = userRole?.isAdmin || userRole?.isTeacher;
  const isPremiumGated = !hasFullAccess && (effectiveStatus === 'expired' || effectiveStatus === 'queued');

  const handleCardClick = () => {
    // Admins and teachers can view any content
    if (hasFullAccess) {
      navigate(`/editor/${item.book_id}`);
      return;
    }

    // Premium gate: Redirect to pricing for expired or scheduled items
    if (effectiveStatus === 'expired' || effectiveStatus === 'queued') {
      navigate('/pricing');
      return;
    }

    // Only allow viewing active content
    if (effectiveStatus === 'active') {
      navigate(`/editor/${item.book_id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (confirm(`Delete "${item.title}" from the queue?`)) {
      deleteMutation.mutate(item.id);
    }
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

  return <Card className={`overflow-hidden border-l-4 transition-all cursor-pointer hover:shadow-lg ${effectiveStatus === 'active' ? 'border-l-green-500 hover:border-l-green-600' : 'border-l-primary/20 hover:border-l-primary/50'} ${isPremiumGated ? 'opacity-75 hover:opacity-100' : ''}`} onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* SEO Thumbnail Image */}
          <div className="flex-shrink-0 w-32 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {seoMetadata?.og_image_url ? (
              <BookImage 
                src={seoMetadata.og_image_url} 
                alt={`${item.title} preview`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Image className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {typeof position === 'number' && <>
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Position {position}
                  </span>
                </>}
              
              {isPremiumGated && <Badge variant="outline" className="flex-shrink-0">
                  🔒 Premium
                </Badge>}
            </div>
            
            <h3 className="text-xl font-bold text-foreground leading-tight mb-1">
              {seoMetadata?.seo_title || item.title || "Unknown Title"}
            </h3>
            
            {seoMetadata?.seo_description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-2">
                {seoMetadata.seo_description}
              </p>}
          </div>

          {/* Delete button - only show for queued/draft items */}
          {(effectiveStatus === 'queued' || effectiveStatus === 'draft') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {effectiveStatus === 'queued' && (
              <>Scheduled: <span className="text-foreground">{formatPublishDate(item.publish_date)}</span></>
            )}
            {effectiveStatus === 'active' && (
              <>Published: <span className="text-green-600">{formatPublishDate(item.publish_date)}</span></>
            )}
            {effectiveStatus === 'expired' && (
              <>Published: <span className="text-muted-foreground">{formatPublishDate(item.publish_date)}</span></>
            )}
          </span>
        </div>
      </CardContent>
    </Card>;
}