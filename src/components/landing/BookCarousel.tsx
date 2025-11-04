import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { BookCarouselCard } from "./BookCarouselCard";
import { DailyPublishedWithBook } from "@/types/dailyPublished";

interface BookCarouselProps {
  books: DailyPublishedWithBook[];
}

export function BookCarousel({ books }: BookCarouselProps) {
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
              <BookCarouselCard book={book} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
