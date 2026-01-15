import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsDown, ThumbsUp, ChevronLeft, ChevronRight, Volume2, Loader2 } from 'lucide-react';
import { WordCarousel } from './WordCarousel';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import type { PageType } from '@/types/book';

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
  showOverlay?: boolean;
  
  // Read/Focus toggle props
  isReadMode?: boolean;
  onToggleReadMode?: () => void;
  isLastWord?: boolean;
  hasReachedLastWord?: boolean;
  
  // Page type filtering
  pageType?: PageType;
  
  // TTS props
  speakText?: string;
  
  // Word sync callback - called when TTS is speaking a word
  onTTSWordChange?: (wordIndex: number) => void;
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
  showOverlay = true,
  isReadMode = false,
  onToggleReadMode,
  isLastWord = false,
  hasReachedLastWord = false,
  pageType,
  speakText,
  onTTSWordChange,
}: UnifiedReadingControlsProps) {
  // Handle word change from TTS - maps TTS word index to overlay word index
  const handleTTSWordChange = useCallback((ttsWordIndex: number, word: string) => {
    if (!overlayWords || !onTTSWordChange) return;
    
    // Find the matching word in overlayWords by comparing the word text
    // TTS may process text differently, so we match by word content
    const matchingIndex = overlayWords.findIndex((w, idx) => {
      // Check if this word matches (case-insensitive, ignore punctuation)
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanOverlay = w.word.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanWord === cleanOverlay;
    });
    
    // If no match found, try sequential matching based on TTS word index
    const targetIndex = matchingIndex >= 0 ? matchingIndex : Math.min(ttsWordIndex, overlayWords.length - 1);
    
    if (targetIndex >= 0 && targetIndex < overlayWords.length) {
      onTTSWordChange(targetIndex);
    }
  }, [overlayWords, onTTSWordChange]);

  const { speak, stop, isLoading, isPlaying, currentWordIndex: ttsWordIndex } = useTextToSpeech({
    onWordChange: handleTTSWordChange,
  });

  // Sync TTS word index to overlay when playing
  useEffect(() => {
    if (isPlaying && ttsWordIndex >= 0 && onTTSWordChange && overlayWords) {
      // Direct index mapping - TTS word order should match overlay word order
      const targetIndex = Math.min(ttsWordIndex, overlayWords.length - 1);
      if (targetIndex >= 0) {
        onTTSWordChange(targetIndex);
      }
    }
  }, [isPlaying, ttsWordIndex, onTTSWordChange, overlayWords]);

  const handleSpeakClick = () => {
    if (isPlaying) {
      stop();
    } else if (speakText) {
      speak(speakText, true); // Enable word sync
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-50 py-3 px-2"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {/* Text Overlay Section - Above all controls */}
      {showOverlay && overlayText && pageType === 'content' && (
        <div 
          className={`mb-3 bg-muted/30 rounded-lg py-2 min-h-[48px] flex items-center justify-start transition-colors max-w-md mx-auto w-full ${
            onToggleReadMode && overlayWords && overlayWords.length > 0 
              ? 'cursor-pointer hover:bg-muted/40 active:bg-muted/50' 
              : ''
          }`}
          onClick={() => {
            if (onToggleReadMode && overlayWords && overlayWords.length > 0) {
              onToggleReadMode();
            }
          }}
          role={onToggleReadMode && overlayWords && overlayWords.length > 0 ? "button" : undefined}
          aria-label={onToggleReadMode && overlayWords && overlayWords.length > 0 ? (isReadMode ? "Switch to Focus mode" : "Switch to Read mode") : undefined}
        >
          <div className="w-full h-[40px] flex items-center justify-start">
            {overlayWords && overlayWords.length > 0 ? (
              isReadMode ? (
                // Read Mode: Show full sentence with highlighted word during TTS
                <p className="text-left font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {isPlaying && ttsWordIndex >= 0 ? (
                    // Show words with current word highlighted in yellow
                    overlayWords.map((w, idx) => (
                      <span
                        key={idx}
                        className={idx === Math.min(ttsWordIndex, overlayWords.length - 1) 
                          ? 'bg-yellow-300 dark:bg-yellow-500 rounded px-0.5 transition-colors duration-150' 
                          : 'transition-colors duration-150'
                        }
                      >
                        {w.word}{idx < overlayWords.length - 1 ? ' ' : ''}
                      </span>
                    ))
                  ) : (
                    overlayText
                  )}
                </p>
              ) : (
                // Focus Mode: Show word carousel (TTS controls the word index when playing)
                <WordCarousel
                  words={overlayWords}
                  currentWordIndex={isPlaying && ttsWordIndex >= 0 ? Math.min(ttsWordIndex, overlayWords.length - 1) : overlayCurrentWordIndex}
                  wordStatuses={overlayWordStatuses}
                />
              )
            ) : (
              // Fallback for non-word content
              <p className="text-center font-semibold text-lg text-gray-900 dark:text-gray-100 line-clamp-2">
                {overlayText}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Row 1: Word Learning Controls */}
      {showWordControls && hasWords && totalWords > 0 && (
        <div className="flex items-center justify-between mb-2 px-2 max-w-md mx-auto w-full">
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
      )}

      {/* Row 2: Page Navigation */}
      <div className="flex items-center gap-2 max-w-md mx-auto w-full">
        <div className="flex items-center h-14 rounded-full bg-muted/30 overflow-hidden flex-1">
          {/* Previous/Left Arrow */}
          <button
            onClick={onPreviousPage}
            disabled={disablePreviousPage || !onPreviousPage}
            className={`flex items-center justify-center h-full rounded-l-full transition-all active:scale-[0.98] shrink-0 w-1/2 ${
              disablePreviousPage || !onPreviousPage
                ? 'opacity-30 cursor-not-allowed pointer-events-none'
                : 'hover:bg-muted/50 cursor-pointer'
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-6 h-6 text-foreground flex-shrink-0" />
          </button>

          {/* Next/Right Arrow - Wide button with dark background */}
          <button
            onClick={onNextPage}
            disabled={disableNextPage || !onNextPage}
            className={`flex items-center justify-center h-full rounded-r-full transition-all active:scale-[0.98] shrink-0 w-1/2 ${
              disableNextPage || !onNextPage
                ? 'opacity-30 cursor-not-allowed pointer-events-none'
                : 'hover:opacity-90 cursor-pointer bg-[hsl(220,40%,15%)]'
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-6 h-6 text-white flex-shrink-0" />
          </button>
        </div>

        {/* TTS Audio Button */}
        {speakText && (
          <button
            onClick={handleSpeakClick}
            disabled={isLoading}
            className={`flex items-center justify-center h-14 w-14 rounded-full transition-all active:scale-[0.98] shrink-0 ${
              isLoading
                ? 'opacity-50 cursor-not-allowed bg-muted/30'
                : isPlaying
                  ? 'bg-primary/20 hover:bg-primary/30 cursor-pointer'
                  : 'bg-muted/30 hover:bg-muted/50 cursor-pointer'
            }`}
            aria-label={isPlaying ? "Stop reading" : "Read aloud"}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 text-foreground animate-spin" />
            ) : (
              <Volume2 className={`w-6 h-6 ${isPlaying ? 'text-primary animate-pulse' : 'text-foreground'}`} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
