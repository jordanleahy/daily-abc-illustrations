import { memo, useState, useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { CategoryBookCarousel } from './CategoryBookCarousel';
import { Skeleton } from '@/components/ui/skeleton';
import type { LibraryBook } from '@/types/library';
import type { LandingLibraryBook } from '@/types/book-extended';

interface LazyCategorySectionProps {
  categoryId: string;
  categoryLabel: string;
  categoryIcon: LucideIcon;
  categoryColor: string;
  books: (LibraryBook | LandingLibraryBook)[];
  showViewAll?: boolean;
  maxBooks?: number;
}

/**
 * Lazy-loaded category section that only renders when visible in viewport.
 * Uses IntersectionObserver for efficient scroll-based loading.
 */
export const LazyCategorySection = memo(({
  categoryId,
  categoryLabel,
  categoryIcon: Icon,
  categoryColor,
  books,
  showViewAll = false,
  maxBooks,
}: LazyCategorySectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasLoaded]);

  // Placeholder skeleton for unloaded sections
  if (!isVisible) {
    return (
      <section ref={sectionRef} className="mb-8">
        {/* Category header skeleton */}
        <div className="flex items-center gap-2 mb-4 px-4 sm:px-6 lg:px-8">
          <Icon className={`w-5 h-5 ${categoryColor}`} />
          <span className="text-lg font-semibold">{categoryLabel}</span>
        </div>
        {/* Book cards skeleton row */}
        <div className="flex gap-4 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <CategoryBookCarousel
      categoryId={categoryId}
      categoryLabel={categoryLabel}
      categoryIcon={Icon}
      categoryColor={categoryColor}
      books={books}
      showViewAll={showViewAll}
      maxBooks={maxBooks}
    />
  );
});

LazyCategorySection.displayName = 'LazyCategorySection';
