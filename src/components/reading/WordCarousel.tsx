import { useEffect, useRef } from 'react';

interface WordCarouselProps {
  words: Array<{ word: string }>;
  currentWordIndex: number;
  wordStatuses?: Record<number, 'difficult' | 'understood'>;
  onWordChange?: (index: number) => void;
}

export function WordCarousel({
  words,
  currentWordIndex,
  wordStatuses,
}: WordCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center current word
  useEffect(() => {
    if (currentWordRef.current && containerRef.current) {
      const container = containerRef.current;
      const word = currentWordRef.current;
      
      const containerWidth = container.offsetWidth;
      const wordLeft = word.offsetLeft;
      const wordWidth = word.offsetWidth;
      
      // Calculate scroll position to center the word
      const scrollPosition = wordLeft - (containerWidth / 2) + (wordWidth / 2);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentWordIndex]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex items-center gap-1.5 px-4 min-w-full justify-center">
        {words.map((wordObj, index) => {
          const isCurrent = index === currentWordIndex;
          const wordStatus = wordStatuses?.[index];
          const isUnderstood = wordStatus === 'understood';
          const isDifficult = wordStatus === 'difficult';

          return (
            <div
              key={index}
              ref={isCurrent ? currentWordRef : null}
              className={`
                inline-block px-3 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out text-xl flex-shrink-0
                ${isCurrent 
                  ? 'text-white scale-110' 
                  : 'text-white/50 scale-90'
                }
                ${isCurrent && isUnderstood ? 'bg-emerald-500/70' : ''}
                ${isCurrent && isDifficult ? 'bg-red-500/70' : ''}
                ${isCurrent && !isUnderstood && !isDifficult ? 'bg-yellow-500/70' : ''}
                ${!isCurrent && isUnderstood ? 'bg-emerald-500/20' : ''}
                ${!isCurrent && isDifficult ? 'bg-red-500/20' : ''}
              `}
              style={{
                fontWeight: isCurrent ? '800' : '600',
              }}
            >
              {index === 0 ? `"${wordObj.word}"` : wordObj.word}
            </div>
          );
        })}
      </div>
    </div>
  );
}
