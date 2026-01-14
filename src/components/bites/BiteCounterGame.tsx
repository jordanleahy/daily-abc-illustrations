import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Undo2, Minus, PartyPopper } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

interface BiteCounterGameProps {
  totalBites: number;
  onComplete?: () => void;
  onReset?: () => void;
}

export function BiteCounterGame({ totalBites, onComplete, onReset }: BiteCounterGameProps) {
  const [remainingBites, setRemainingBites] = useState(totalBites);
  const [history, setHistory] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const bitesEaten = totalBites - remainingBites;
  const progressPercent = totalBites > 0 ? (bitesEaten / totalBites) * 100 : 0;
  const isComplete = remainingBites <= 0;

  const triggerHaptic = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available (web browser)
    }
  }, []);

  const decrementBites = useCallback((amount: number) => {
    if (remainingBites <= 0) return;
    
    const actualDecrement = Math.min(amount, remainingBites);
    setHistory(prev => [...prev, actualDecrement]);
    setRemainingBites(prev => Math.max(0, prev - actualDecrement));
    
    // Animate the number
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
    
    triggerHaptic();

    // Check for completion
    if (remainingBites - actualDecrement <= 0) {
      setTimeout(() => {
        onComplete?.();
      }, 300);
    }
  }, [remainingBites, triggerHaptic, onComplete]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    
    const lastDecrement = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setRemainingBites(prev => Math.min(totalBites, prev + lastDecrement));
    triggerHaptic();
  }, [history, totalBites, triggerHaptic]);

  const handleReset = useCallback(() => {
    setRemainingBites(totalBites);
    setHistory([]);
    onReset?.();
  }, [totalBites, onReset]);

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="relative mb-6">
          <PartyPopper className="w-24 h-24 text-primary animate-bounce" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full animate-ping" />
        </div>
        <h2 className="text-3xl font-bold text-primary mb-2">All Done!</h2>
        <p className="text-lg text-muted-foreground mb-6">Great job finishing your food! 🎉</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset}>
            Start Over
          </Button>
          <Button onClick={handleUndo} disabled={history.length === 0}>
            <Undo2 className="w-4 h-4 mr-2" />
            Undo Last
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6">
      {/* Main bite counter display */}
      <div 
        className={cn(
          "flex flex-col items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/30 mb-6 transition-transform cursor-pointer select-none",
          isAnimating && "scale-95"
        )}
        onClick={() => decrementBites(1)}
        role="button"
        aria-label="Tap to count one bite"
      >
        <span className={cn(
          "text-6xl font-bold text-primary transition-transform",
          isAnimating && "scale-110"
        )}>
          {remainingBites}
        </span>
        <span className="text-lg text-muted-foreground">
          {remainingBites === 1 ? 'bite' : 'bites'} left
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{bitesEaten} eaten</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <Progress value={progressPercent} className="h-3" />
      </div>

      {/* Tap instruction */}
      <div className="text-center mb-6 px-4">
        <p className="text-lg font-medium text-foreground">👆 Tap the circle for each bite!</p>
        <p className="text-sm text-muted-foreground">Or use the quick buttons below</p>
      </div>

      {/* Quick decrement buttons */}
      <div className="flex gap-3 mb-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => decrementBites(1)}
          disabled={remainingBites < 1}
        >
          <Minus className="w-4 h-4 mr-1" />
          1
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => decrementBites(3)}
          disabled={remainingBites < 1}
        >
          <Minus className="w-4 h-4 mr-1" />
          3
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => decrementBites(5)}
          disabled={remainingBites < 1}
        >
          <Minus className="w-4 h-4 mr-1" />
          5
        </Button>
      </div>

      {/* Undo button */}
      <Button 
        variant="ghost" 
        onClick={handleUndo}
        disabled={history.length === 0}
        className="text-muted-foreground"
      >
        <Undo2 className="w-4 h-4 mr-2" />
        Undo ({history.length})
      </Button>
    </div>
  );
}
