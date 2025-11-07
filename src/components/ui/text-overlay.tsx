import { cn } from '@/lib/utils';

interface TextOverlayProps {
  text: string;
  show?: boolean;
  className?: string;
}

/**
 * CSS-based text overlay component for displaying text on images
 * Positioned at bottom-center with semi-transparent background
 * Used in GoogleChat QA panel and reading mode
 */
export function TextOverlay({ text, show = true, className }: TextOverlayProps) {
  if (!show || !text) return null;
  
  return (
    <div 
      className={cn(
        "absolute bottom-0 left-0 right-0 z-10",
        "bg-black/60 backdrop-blur-sm",
        "px-4 py-3",
        "flex items-center justify-center",
        className
      )}
    >
      <p className="text-white text-center font-semibold text-lg leading-tight line-clamp-2">
        {text}
      </p>
    </div>
  );
}
