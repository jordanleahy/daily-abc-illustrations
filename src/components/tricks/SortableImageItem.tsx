import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';

interface SortableImageItemProps {
  id: string;
  imageUrl: string;
  index: number;
  onRemove: () => void;
  disabled?: boolean;
}

export function SortableImageItem({ id, imageUrl, index, onRemove, disabled }: SortableImageItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? 'opacity-50 scale-105 shadow-lg z-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <img
        src={imageUrl}
        alt={`Trick ${index + 1}`}
        className={`w-16 h-16 object-cover rounded-lg border-2 border-border ${
          !disabled ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      />
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
