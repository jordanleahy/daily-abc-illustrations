import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { BookThumbnail } from '@/types/bookThumbnail';
import { formatDistanceToNow } from 'date-fns';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface BookThumbnailVersionHistoryProps {
  thumbnails: BookThumbnail[];
  selectedVersionId?: string;
  onVersionSelect: (thumbnail: BookThumbnail) => void;
  onRevertToVersion: (thumbnail: BookThumbnail) => void;
  isCurrentLatest: boolean;
  onBackToCurrent: () => void;
  isReverting?: boolean;
}

export const BookThumbnailVersionHistory: React.FC<BookThumbnailVersionHistoryProps> = ({
  thumbnails,
  selectedVersionId,
  onVersionSelect,
  onRevertToVersion,
  isCurrentLatest,
  onBackToCurrent,
  isReverting = false,
}) => {
  if (!thumbnails || thumbnails.length <= 1) {
    return null;
  }

  const sortedThumbnails = [...thumbnails].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusBadge = (thumbnail: BookThumbnail) => {
    if (thumbnail.is_latest) {
      return <Badge variant="default" className="text-xs">Current</Badge>;
    }
    return <Badge variant="outline" className="text-xs">v{thumbnail.version_number}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Version History</h3>
        {!isCurrentLatest && (
          <Button
            onClick={onBackToCurrent}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Back to Current
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sortedThumbnails.map((thumbnail) => {
          const isSelected = selectedVersionId === thumbnail.id;
          const isLatest = thumbnail.is_latest;
          
          return (
            <div key={thumbnail.id} className="space-y-2">
              <div
                className={`
                  relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all
                  aspect-[1200/630] bg-muted
                  ${isSelected 
                    ? 'border-primary shadow-md' 
                    : isLatest 
                      ? 'border-green-500 shadow-sm' 
                      : 'border-border hover:border-primary/50'
                  }
                `}
                onClick={() => onVersionSelect(thumbnail)}
              >
                {thumbnail.thumbnail_url ? (
                  <OptimizedImage
                    src={thumbnail.thumbnail_url}
                    alt={`Version ${thumbnail.version_number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    {getStatusIcon(thumbnail.generation_status)}
                  </div>
                )}
                
                {/* Status overlay */}
                <div className="absolute top-2 left-2">
                  {getStatusBadge(thumbnail)}
                </div>

                {/* Generation status */}
                <div className="absolute top-2 right-2">
                  {getStatusIcon(thumbnail.generation_status)}
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <div className="font-medium">
                  Version {thumbnail.version_number}
                </div>
                <div>
                  {formatDistanceToNow(new Date(thumbnail.created_at), { addSuffix: true })}
                </div>
                
                {isSelected && !isLatest && thumbnail.generation_status === 'complete' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevertToVersion(thumbnail);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs w-full"
                    disabled={isReverting}
                  >
                    {isReverting ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Reverting...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Revert to This
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};