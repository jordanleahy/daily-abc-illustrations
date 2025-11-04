import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { HabitTrackingCard } from "./HabitTrackingCard";
import { HabitCompletionWithDetails } from "@/types/habit";

interface HabitCarouselProps {
  completions: HabitCompletionWithDetails[];
}

export function HabitCarousel({ completions }: HabitCarouselProps) {
  return (
    <div className="-mx-4 md:-mx-6">
      <Carousel
        opts={{
          align: "start",
          dragFree: false,
          containScroll: "trimSnaps",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {completions.map((completion) => (
            <CarouselItem key={completion.id} className="pl-4 basis-[85vw] sm:basis-[70vw]">
              <HabitTrackingCard completion={completion} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
