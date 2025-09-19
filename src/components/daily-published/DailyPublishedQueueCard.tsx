import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeRemaining } from '@/utils/timeUtils';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { Clock, Calendar, Hash, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DailyPublishedQueueCardProps {
  item: DailyPublishedWithBook;
  position: number;
  expectedActivationTime?: string;
}

export function DailyPublishedQueueCard({ 
  item, 
  position,
  expectedActivationTime 
}: DailyPublishedQueueCardProps) {
  const navigate = useNavigate();
  
  // Fetch SEO metadata for this specific daily published item
  const { data: seoMetadata } = useSeoMetadata(item.id);

  const handleCardClick = () => {
    navigate(`/books/${item.book_id}`);
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
    if (item.status === 'active') {
      return {
        icon: Clock,
        label: 'Expires',
        value: formatTimeRemaining(item.expires_at),
        color: 'text-red-600'
      };
    }
    
    if (item.status === 'queued' && expectedActivationTime) {
      const now = new Date().getTime();
      const activation = new Date(expectedActivationTime).getTime();
      
      return {
        icon: Calendar,
        label: 'Scheduled to activate',
        value: new Date(expectedActivationTime).toLocaleDateString() + ' at ' + 
               new Date(expectedActivationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        color: 'text-blue-600'
      };
    }
    
    if (item.status === 'expired') {
      return {
        icon: Calendar,
        label: 'Expired',
        value: new Date(item.expires_at).toLocaleDateString(),
        color: 'text-gray-500'
      };
    }

    return null;
  };

  const timingInfo = getTimingDisplay();

  return (
    <Card 
      className="overflow-hidden border-l-4 border-l-primary/20 hover:border-l-primary/50 transition-colors cursor-pointer hover:shadow-lg"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* OG Image on the left */}
          <div className="flex-shrink-0 w-32 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {seoMetadata?.og_image_url ? (
              <img 
                src={seoMetadata.og_image_url} 
                alt={`${item.title} OpenGraph preview`}
                className="w-full h-full object-cover"
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
              <Badge variant={getStatusVariant(item.status)} className="flex-shrink-0">
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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
          
          {item.status === 'active' && (
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
  );
}