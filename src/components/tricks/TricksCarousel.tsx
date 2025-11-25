import { memo, useState, useMemo } from 'react';
import { Snowflake } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { TricksCarouselCard } from './TricksCarouselCard';
import { TrickActionModal } from './TrickActionModal';
import { Trick, TrickGoalWithDetails } from '@/types/trick';
import { LIBRARY_CONFIG } from '@/config/library';
import { LIBRARY_STYLES } from '@/styles/library.styles';

interface TricksCarouselProps {
  tricks: Trick[];
  goals: TrickGoalWithDetails[];
}

export const TricksCarousel = memo(({
  tricks,
  goals,
}: TricksCarouselProps) => {
  const [selectedTrick, setSelectedTrick] = useState<Trick | null>(null);

  if (tricks.length === 0) return null;

  // Find goal for selected trick
  const selectedGoal = useMemo(() => {
    if (!selectedTrick) return null;
    return goals.find(goal => goal.trick_id === selectedTrick.id) || null;
  }, [selectedTrick, goals]);

  return (
    <section className={LIBRARY_STYLES.carousel.section}>
      {/* Section header */}
      <div className={LIBRARY_STYLES.carousel.header}>
        <h2 className={LIBRARY_STYLES.carousel.title}>
          <Snowflake className={`${LIBRARY_STYLES.carousel.icon} text-primary`} />
          <span>Tricks</span>
        </h2>
      </div>

      {/* Carousel */}
      <Carousel
        opts={LIBRARY_CONFIG.CAROUSEL}
        className={LIBRARY_STYLES.carousel.wrapper}
      >
        <CarouselContent className={LIBRARY_STYLES.carousel.content}>
          {tricks.map((trick) => {
            const trickGoal = goals.find(goal => goal.trick_id === trick.id) || null;
            return (
              <CarouselItem
                key={trick.id}
                className={LIBRARY_STYLES.carousel.item}
              >
                <TricksCarouselCard
                  trick={trick}
                  goal={trickGoal}
                  onClick={() => setSelectedTrick(trick)}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>

      {/* Action Modal */}
      <TrickActionModal
        open={!!selectedTrick}
        onOpenChange={(open) => !open && setSelectedTrick(null)}
        trick={selectedTrick}
        goal={selectedGoal}
      />
    </section>
  );
});

TricksCarousel.displayName = 'TricksCarousel';
