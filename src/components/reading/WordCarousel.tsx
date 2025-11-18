import React, { useRef, useEffect } from 'react';

interface WordCarouselProps {
  words: Array<{ word: string }>;
  currentWordIndex: number;
  wordStatuses?: Record<number, 'difficult' | 'understood'>;
}

export function WordCarousel({
  words,
  currentWordIndex,
  wordStatuses,
}: WordCarouselProps) {
  const currentWordRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current word
  useEffect(() => {
    currentWordRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest',
      inline: 'center' 
    });
  }, [currentWordIndex]);
  return (
    <div 
      className="w-full h-full flex items-center overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex items-center gap-1.5 px-2">
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
                  ? 'text-gray-900' 
                  : 'text-gray-900/50'
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
              {wordObj.word}
            </div>
          );
        })}
      </div>
    </div>
  );
}
