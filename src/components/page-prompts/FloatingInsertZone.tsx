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
        // Mobile: Full width horizontal divider
        "w-full h-2",
        // Desktop/Tablet: Vertical divider between cards
        "md:w-8 md:h-auto md:self-stretch",
        isHovered ? "h-12 md:h-auto" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Divider line - horizontal on mobile, vertical on desktop */}
      <div 
        className={cn(
          "absolute inset-0 flex transition-opacity duration-300",
          // Mobile: horizontal center alignment
          "items-center md:justify-center",
          isHovered ? "opacity-100" : "opacity-30 md:opacity-20"
        )}
      >
        {/* Horizontal line for mobile */}
        <div className="w-full border-t-2 border-dashed border-muted-foreground/30 md:hidden" />
        {/* Vertical line for desktop */}
        <div className="hidden md:block h-full border-l-2 border-dashed border-muted-foreground/30" />
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
