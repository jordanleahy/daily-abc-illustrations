import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingInsertZoneProps {
  onInsert: () => void;
  position: 'before' | 'after';
  isFirst?: boolean;
  isLast?: boolean;
}

export function FloatingInsertZone({ 
  onInsert, 
  position, 
  isFirst = false,
  isLast = false 
}: FloatingInsertZoneProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center transition-all duration-300 group",
        "h-2 md:h-1",
        isHovered ? "h-12 md:h-16" : "",
        "col-span-full"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Divider line - always visible on mobile, subtle on desktop */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-30 md:opacity-20"
        )}
      >
        <div className="w-full border-t-2 border-dashed border-muted-foreground/30" />
      </div>

      {/* Insert button */}
      <button
        onClick={onInsert}
        className={cn(
          "relative z-10 transition-all duration-300 rounded-full",
          "flex items-center gap-2 px-4 py-2",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:scale-110 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          // Mobile: Always visible but small
          "opacity-100 scale-90",
          // Desktop: Hidden until hover
          "md:opacity-0 md:scale-0 md:group-hover:opacity-100 md:group-hover:scale-100"
        )}
        aria-label={`Insert page ${position === 'before' ? 'at beginning' : 'here'}`}
      >
        <Plus className="w-4 h-4" />
        <span className={cn(
          "text-sm font-medium whitespace-nowrap transition-all duration-300",
          isHovered ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0 md:max-w-0 overflow-hidden"
        )}>
          Insert Page {isFirst ? 'at Start' : 'Here'}
        </span>
      </button>
    </div>
  );
}
