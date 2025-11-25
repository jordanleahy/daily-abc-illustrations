import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Play } from 'lucide-react';

interface SortableVideoItemProps {
  id: string;
  thumbnail: string;
  duration: number;
  index: number;
  onRemove: () => void;
  disabled?: boolean;
}

export function SortableVideoItem({ id, thumbnail, duration, index, onRemove, disabled }: SortableVideoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'opacity-50 scale-105 shadow-lg z-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className={`relative w-16 h-16 rounded-lg border-2 border-border overflow-hidden bg-black ${
        !disabled ? 'cursor-grab active:cursor-grabbing' : ''
      }`}>
        <img
          src={thumbnail}
          alt={`Video ${index + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="h-6 w-6 text-white" fill="white" />
        </div>
        {duration > 0 && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
            {formatDuration(duration)}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={disabled}
        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
