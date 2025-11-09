import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MinusCircle, XCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface WordLearningControlsProps {
  isEnlarged: boolean;
  onToggleEnlarge: () => void;
  onMarkDifficult: () => void;
  onMarkUnderstood: () => void;
  currentWordIndex: number;
  totalWords: number;
  onNavigateWord?: (direction: 'prev' | 'next') => void;
}

export function WordLearningControls({
  isEnlarged,
  onToggleEnlarge,
  onMarkDifficult,
  onMarkUnderstood,
  currentWordIndex,
  totalWords,
  onNavigateWord,
}: WordLearningControlsProps) {
  // Don't show if no words
  if (totalWords === 0) return null;

  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-3">
          {/* Left side - Learning controls */}
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

          {/* Right side - Navigation arrows */}
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
      </CardContent>
    </Card>
  );
}
