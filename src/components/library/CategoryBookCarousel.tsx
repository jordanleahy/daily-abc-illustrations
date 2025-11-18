import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LucideIcon } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { LibraryBookCard } from './LibraryBookCard';
import type { LibraryBook } from '@/types/library';
import type { LandingLibraryBook } from '@/types/book-extended';
import { LIBRARY_ROUTES } from '@/config/routes';
import { LIBRARY_TEXT } from '@/config/libraryText';
import { LIBRARY_CONFIG } from '@/config/library';
import { LIBRARY_STYLES } from '@/styles/library.styles';

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

      {/* Carousel - edge to edge */}
      <Carousel
        opts={LIBRARY_CONFIG.CAROUSEL}
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
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </section>
  );
});

CategoryBookCarousel.displayName = 'CategoryBookCarousel';
