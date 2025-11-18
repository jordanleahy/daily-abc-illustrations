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
          dragFree: true,
          containScroll: "trimSnaps",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {completions.map((completion) => (
            <CarouselItem key={completion.id} className="pl-4 basis-[50vw] sm:basis-[45vw] md:basis-[35vw] lg:basis-[22vw]">
              <HabitTrackingCard completion={completion} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
