import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { BookCarouselCard } from "./BookCarouselCard";
import { LibraryBookWithImages } from "@/hooks/useWinterThemedBooks";

type ViewMode = 'cover' | 'educational';

interface BookCarouselProps {
  books: LibraryBookWithImages[];
}

export function BookCarousel({ books }: BookCarouselProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cover');

  const handleToggle = () => {
    setViewMode(prev => prev === 'cover' ? 'educational' : 'cover');
  };

  return (
    <div className="-mx-4 md:-mx-6">
      <Carousel
        opts={{
          align: "start",
          dragFree: false,
          containScroll: "trimSnaps",
        }}
        plugins={[WheelGesturesPlugin()]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {books.map((book) => (
            <CarouselItem key={book.id} className="pl-4 basis-[65vw] sm:basis-[45vw] md:basis-[35vw] lg:basis-[25vw] xl:basis-[20vw]">
              <BookCarouselCard 
                book={book} 
                viewMode={viewMode}
                onImageClick={handleToggle}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
