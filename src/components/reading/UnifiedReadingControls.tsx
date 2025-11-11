import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, XCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface UnifiedReadingControlsProps {
  // Word learning props
  hasWords?: boolean;
  isEnlarged?: boolean;
  onToggleEnlarge?: () => void;
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
}

export function UnifiedReadingControls({
  hasWords = false,
  isEnlarged = false,
  onToggleEnlarge,
  onMarkDifficult,
  onMarkUnderstood,
  currentWordIndex = 0,
  totalWords = 0,
  onNavigateWord,
  onPreviousPage,
  onNextPage,
  disablePreviousPage = false,
  disableNextPage = false,
}: UnifiedReadingControlsProps) {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50 py-3 px-4"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* Row 1: Word Learning Controls */}
      {hasWords && totalWords > 0 && (
        <div className="flex items-center justify-between mb-2">
          {/* Left: Word Learning Buttons */}
          <div className="flex items-center gap-3">
            {/* Plus/Minus Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleEnlarge}
              className="h-12 w-12 rounded-full"
              title={isEnlarged ? "Shrink word" : "Enlarge word"}
            >
              {isEnlarged ? (
                <MinusCircle className="h-6 w-6" />
              ) : (
                <PlusCircle className="h-6 w-6" />
              )}
            </Button>

            {/* Red Button - Mark Difficult */}
            <Button
              variant="outline"
              size="icon"
              onClick={onMarkDifficult}
              className="h-12 w-12 rounded-full border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700"
              title="Mark as difficult"
              disabled={currentWordIndex >= totalWords - 1}
            >
              <XCircle className="h-6 w-6" />
            </Button>

            {/* Green Button - Mark Understood */}
            <Button
              variant="outline"
              size="icon"
              onClick={onMarkUnderstood}
              className="h-12 w-12 rounded-full border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-600 hover:text-green-700"
              title="Mark as understood"
              disabled={currentWordIndex >= totalWords - 1}
            >
              <CheckCircle className="h-6 w-6" />
            </Button>
          </div>

          {/* Right: Word Navigation - Small arrows */}
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
      )}

      {/* Row 2: Page Navigation */}
      <div className="flex items-center h-14 rounded-full bg-muted/30 overflow-hidden">
        {/* Previous/Left Arrow */}
        <button
          onClick={onPreviousPage}
          disabled={disablePreviousPage || !onPreviousPage}
          className={`flex items-center justify-center h-full rounded-l-full transition-all active:scale-[0.98] ${
            disablePreviousPage || !onPreviousPage
              ? 'opacity-30 cursor-not-allowed w-16'
              : 'hover:bg-muted/50 cursor-pointer w-[48%]'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        {/* Center spacer */}
        <div className="flex-1" />

        {/* Next/Right Arrow - Wide button with dark background */}
        <button
          onClick={onNextPage}
          disabled={disableNextPage || !onNextPage}
          className={`flex items-center justify-center h-full rounded-r-full transition-all active:scale-[0.98] ${
            disableNextPage || !onNextPage
              ? 'opacity-30 cursor-not-allowed w-16'
              : 'hover:opacity-90 cursor-pointer w-[48%] bg-[hsl(220,40%,15%)]'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
