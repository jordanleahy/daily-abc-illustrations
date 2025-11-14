import { Button } from '@/components/ui/button';
import { ThumbsDown, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { WordCarousel } from './WordCarousel';

interface UnifiedReadingControlsProps {
  // Word learning props
  hasWords?: boolean;
  onMarkDifficult?: () => void;
  onMarkUnderstood?: () => void;
  currentWordIndex?: number;
  totalWords?: number;
  onNavigateWord?: (direction: 'prev' | 'next') => void;
  
  // Page navigation props
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  disablePreviousPage?: boolean;
  disableNextPage?: boolean;
  showWordControls?: boolean;
  
  // Text overlay props (Phase 1)
  overlayText?: string;
  overlayWords?: Array<{ word: string }>;
  overlayCurrentWordIndex?: number;
  overlayWordStatuses?: Record<number, 'difficult' | 'understood'>;
  onOverlayWordChange?: (index: number) => void;
  showOverlay?: boolean;
}

export function UnifiedReadingControls({
  hasWords = false,
  onMarkDifficult,
  onMarkUnderstood,
  currentWordIndex = 0,
  totalWords = 0,
  onNavigateWord,
  onPreviousPage,
  onNextPage,
  disablePreviousPage = false,
  disableNextPage = false,
  showWordControls = true,
  overlayText,
  overlayWords,
  overlayCurrentWordIndex = 0,
  overlayWordStatuses,
  onOverlayWordChange,
  showOverlay = true,
}: UnifiedReadingControlsProps) {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50 py-3 px-4 min-h-[212px]"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* Text Overlay Section - Above all controls */}
      {showOverlay && overlayText && (
        <div className="mb-3 bg-muted/30 rounded-lg px-4 py-2 h-[64px] flex items-center justify-center">
          {overlayWords && overlayWords.length > 0 ? (
            <div className="w-full h-[40px]">
              <WordCarousel
                words={overlayWords}
                currentWordIndex={overlayCurrentWordIndex}
                wordStatuses={overlayWordStatuses}
                onWordChange={onOverlayWordChange}
              />
            </div>
          ) : (
            <p className="text-center font-semibold text-lg text-foreground line-clamp-2">
              {overlayText}
            </p>
          )}
        </div>
      )}
      
      {/* Row 1: Word Learning Controls - Always reserve space */}
      {showWordControls && hasWords && totalWords > 0 ? (
        <div className="flex items-center justify-between mb-2 h-[56px]">
          {/* Left: Word Learning Buttons */}
          <div className="flex items-center gap-3">
            {/* Red Button - Mark Difficult */}
            <Button
              variant="outline"
              size="icon"
              onClick={onMarkDifficult}
              className="h-12 w-12 rounded-full border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700"
              title="Mark as difficult"
            >
              <ThumbsDown className="h-6 w-6" />
            </Button>

            {/* Green Button - Mark Understood */}
            <Button
              variant="outline"
              size="icon"
              onClick={onMarkUnderstood}
              className="h-12 w-12 rounded-full border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-600 hover:text-green-700"
              title="Mark as understood"
            >
              <ThumbsUp className="h-6 w-6" />
            </Button>
          </div>

          {/* Right: Word Navigation - Always visible arrows */}
          {onNavigateWord && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigateWord('prev')}
                disabled={currentWordIndex === 0}
                className="h-10 w-10 rounded-full"
                title="Previous word"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onNavigateWord('next')}
                disabled={currentWordIndex >= totalWords - 1}
                className="h-10 w-10 rounded-full"
                title="Next word"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-2 h-[56px]" />
      )}

      {/* Row 2: Page Navigation */}
      <div className="flex items-center h-14 rounded-full bg-muted/30 overflow-hidden">
        {/* Previous/Left Arrow */}
        <button
          onClick={onPreviousPage}
          disabled={disablePreviousPage || !onPreviousPage}
          className={`flex items-center justify-center h-full rounded-l-full transition-all active:scale-[0.98] shrink-0 ${
            disablePreviousPage || !onPreviousPage
              ? 'opacity-30 cursor-not-allowed pointer-events-none w-[48%]'
              : 'hover:bg-muted/50 cursor-pointer w-[48%]'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6 text-foreground flex-shrink-0" />
        </button>

        {/* Center spacer */}
        <div className="flex-1" />

        {/* Next/Right Arrow - Wide button with dark background */}
        <button
          onClick={onNextPage}
          disabled={disableNextPage || !onNextPage}
          className={`flex items-center justify-center h-full rounded-r-full transition-all active:scale-[0.98] shrink-0 ${
            disableNextPage || !onNextPage
              ? 'opacity-30 cursor-not-allowed pointer-events-none w-[48%]'
              : 'hover:opacity-90 cursor-pointer w-[48%] bg-[hsl(220,40%,15%)]'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6 text-white flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
