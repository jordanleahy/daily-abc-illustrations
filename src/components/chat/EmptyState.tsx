import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BOOK_TYPES } from '@/config/bookTypes';
import { cn } from '@/lib/utils';
import colorsBookCover from '@/assets/book-covers/colors-cover.png';
import shapesBookCover from '@/assets/book-covers/shapes-cover.png';
import emotionsBookCover from '@/assets/book-covers/emotions-cover.png';
import oppositesBookCover from '@/assets/book-covers/opposites-cover.png';
import rhymingBookCover from '@/assets/book-covers/rhyming-cover.png';
import animalsBookCover from '@/assets/book-covers/animals-cover.png';

interface EmptyStateProps {
  onBookTypeSelect: (bookType: typeof BOOK_TYPES[0]) => void;
}

export const EmptyState = memo(({ onBookTypeSelect }: EmptyStateProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-start p-4 sm:p-8 pt-8 sm:pt-16 overflow-y-auto">
      <div className="mb-6 sm:mb-8 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
        <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-xl sm:text-2xl font-bold text-center">What would you like to create?</h2>
      <p className="mb-6 sm:mb-8 text-center text-sm sm:text-base text-muted-foreground px-2">
        Choose a book type to start creating your educational content
      </p>
      
      <div className="grid w-full max-w-2xl gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 pb-8">
        {BOOK_TYPES.map((bookType) => {
          const IconComponent = bookType.icon;
          const coverImages: Record<string, string> = {
            colors: colorsBookCover,
            shapes: shapesBookCover,
            emotions: emotionsBookCover,
            opposites: oppositesBookCover,
            rhyming: rhymingBookCover,
            animals: animalsBookCover,
          };
          const coverImage = coverImages[bookType.id];
          
          return (
            <Button
              key={bookType.id}
              onClick={() => onBookTypeSelect(bookType)}
              variant="outline"
              className={cn(
                "h-auto flex-col items-start gap-2 text-left overflow-hidden",
                "hover:border-primary hover:bg-primary/5",
                coverImage ? "p-0" : "p-4"
              )}
            >
              {coverImage ? (
                <img 
                  src={coverImage} 
                  alt={bookType.label}
                  className="w-full h-auto"
                />
              ) : (
                <div className="flex flex-col gap-2 p-4 w-full">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" />
                    <span className="font-semibold">{bookType.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bookType.description}
                  </p>
                </div>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
