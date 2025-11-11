import { useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface WordCarouselProps {
  words: Array<{ word: string }>;
  currentWordIndex: number;
  wordStatuses?: Record<number, 'difficult' | 'understood'>;
  onCarouselApiReady?: (api: CarouselApi) => void;
  onWordChange?: (index: number) => void;
}

export function WordCarousel({
  words,
  currentWordIndex,
  wordStatuses,
  onCarouselApiReady,
  onWordChange,
}: WordCarouselProps) {
  const handleSetApi = (api: CarouselApi) => {
    if (!api) return;
    
    onCarouselApiReady?.(api);
    
    // Listen to carousel selection changes
    api.on('select', () => {
      const selectedIndex = api.selectedScrollSnap();
      onWordChange?.(selectedIndex);
    });
  };

  return (
    <div className="w-full py-8">
      <Carousel
        opts={{
          align: 'center',
          loop: false,
          skipSnaps: false,
        }}
        setApi={handleSetApi}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {words.map((wordObj, index) => {
            const isCurrent = index === currentWordIndex;
            const wordStatus = wordStatuses?.[index];
            const isUnderstood = wordStatus === 'understood';
            const isDifficult = wordStatus === 'difficult';

            return (
              <CarouselItem
                key={index}
                className="pl-2 basis-1/3 flex items-center justify-center"
              >
                <div
                  className={`
                    inline-block px-3 py-2 rounded-lg font-semibold transition-all duration-500 ease-in-out
                    ${isCurrent 
                      ? 'text-white text-2xl transform scale-150' 
                      : 'text-white/50 text-base'
                    }
                    ${isCurrent && isUnderstood ? 'bg-emerald-500/60' : ''}
                    ${isCurrent && isDifficult ? 'bg-red-500/60' : ''}
                    ${isCurrent && !isUnderstood && !isDifficult ? 'bg-yellow-500/60' : ''}
                    ${!isCurrent && isUnderstood ? 'bg-emerald-500/30' : ''}
                    ${!isCurrent && isDifficult ? 'bg-red-500/30' : ''}
                  `}
                  style={{
                    fontWeight: isCurrent ? '800' : '600',
                  }}
                >
                  {wordObj.word}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
