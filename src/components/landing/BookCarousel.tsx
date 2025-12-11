import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
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
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {books.map((book) => (
            <CarouselItem key={book.id} className="pl-4 basis-[85vw] sm:basis-[70vw] md:basis-[45vw] lg:basis-[30vw]">
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
