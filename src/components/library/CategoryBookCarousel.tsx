import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LucideIcon } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { LibraryBookCard } from './LibraryBookCard';
import type { LibraryBook } from '@/types/library';
import type { LandingLibraryBook } from '@/types/book-extended';

interface CategoryBookCarouselProps {
  categoryId: string;
  categoryLabel: string;
  categoryIcon: LucideIcon;
  categoryColor: string;
  books: (LibraryBook | LandingLibraryBook)[];
  showViewAll?: boolean;
  maxBooks?: number;
}

export const CategoryBookCarousel = memo(({
  categoryId,
  categoryLabel,
  categoryIcon: Icon,
  categoryColor,
  books,
  showViewAll = false,
  maxBooks,
}: CategoryBookCarouselProps) => {
  const navigate = useNavigate();
  
  // Limit books if maxBooks is specified
  const displayBooks = maxBooks ? books.slice(0, maxBooks) : books;
  
  if (displayBooks.length === 0) return null;

  const handleViewAll = () => {
    navigate(`/library?category=${categoryId}`);
  };

  return (
    <section className="py-6 -mx-4 md:-mx-6">
      {/* Section header - stays within padding */}
      <div className="px-4 md:px-6 mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Icon className={`w-6 h-6 ${categoryColor}`} />
          <span>{categoryLabel}</span>
        </h2>
        {showViewAll && (
          <button
            onClick={handleViewAll}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Carousel - edge to edge */}
      <Carousel
        opts={{
          align: 'start',
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {displayBooks.map((book, index) => (
            <CarouselItem
              key={book.id}
              className="pl-4 basis-[82vw] sm:basis-[70vw] md:basis-[45vw] lg:basis-[30vw]"
            >
              <LibraryBookCard
                book={book}
                priority={index < 3}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
});

CategoryBookCarousel.displayName = 'CategoryBookCarousel';
