import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, LucideIcon } from 'lucide-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { LibraryBookCard } from './LibraryBookCard';
import type { LibraryBook } from '@/types/library';
import type { LandingLibraryBook } from '@/types/book-extended';
import { LIBRARY_ROUTES } from '@/config/routes';
import { LIBRARY_TEXT } from '@/config/libraryText';
import { LIBRARY_CONFIG } from '@/config/library';
import { LIBRARY_STYLES } from '@/styles/library.styles';
import { cn } from '@/lib/utils';
import type { CarouselApi } from '@/components/ui/carousel';

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
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Limit books if maxBooks is specified
  const displayBooks = maxBooks ? books.slice(0, maxBooks) : books;
  
  // Update scroll state when API changes
  useEffect(() => {
    if (!api) return;
    
    const onSelect = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);
  
  if (displayBooks.length === 0) return null;

  const handleViewAll = () => {
    navigate(LIBRARY_ROUTES.CATEGORY(categoryId));
  };

  return (
    <section className={LIBRARY_STYLES.carousel.section}>
      {/* Section header - stays within padding */}
      <div className={LIBRARY_STYLES.carousel.header}>
        <h2 className={LIBRARY_STYLES.carousel.title}>
          <Icon className={`${LIBRARY_STYLES.carousel.icon} ${categoryColor}`} />
          <span>{categoryLabel}</span>
        </h2>
        {showViewAll && (
          <button
            onClick={handleViewAll}
            className={LIBRARY_STYLES.carousel.viewAllButton}
          >
            {LIBRARY_TEXT.ACTIONS.VIEW_ALL}
            <ChevronRight className={LIBRARY_STYLES.carousel.chevron} />
          </button>
        )}
      </div>

      {/* Carousel - edge to edge with hover arrows */}
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Carousel
          opts={LIBRARY_CONFIG.CAROUSEL}
          plugins={[WheelGesturesPlugin()]}
          setApi={setApi}
          className={LIBRARY_STYLES.carousel.wrapper}
        >
          <CarouselContent className={LIBRARY_STYLES.carousel.content}>
            {displayBooks.map((book, index) => (
              <CarouselItem
                key={book.id}
                className={LIBRARY_STYLES.carousel.item}
              >
                <LibraryBookCard
                  book={book}
                  priority={index < LIBRARY_CONFIG.PRIORITY_IMAGE_COUNT}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        {/* Left arrow - visible on hover */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border-border",
            "transition-opacity duration-200",
            "hidden md:flex",
            isHovered && canScrollPrev ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => api?.scrollPrev()}
          disabled={!canScrollPrev}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Previous</span>
        </Button>
        
        {/* Right arrow - visible on hover */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border-border",
            "transition-opacity duration-200",
            "hidden md:flex",
            isHovered && canScrollNext ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => api?.scrollNext()}
          disabled={!canScrollNext}
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </section>
  );
});

CategoryBookCarousel.displayName = 'CategoryBookCarousel';
