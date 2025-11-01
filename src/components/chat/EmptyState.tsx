import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BOOK_TYPES } from '@/config/bookTypes';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  onBookTypeSelect: (bookType: typeof BOOK_TYPES[0]) => void;
}

export const EmptyState = memo(({ onBookTypeSelect }: EmptyStateProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">What would you like to create?</h2>
      <p className="mb-8 text-center text-muted-foreground">
        Choose a book type to start creating your educational content
      </p>
      
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {BOOK_TYPES.map((bookType) => {
          const IconComponent = bookType.icon;
          return (
            <Button
              key={bookType.id}
              onClick={() => onBookTypeSelect(bookType)}
              variant="outline"
              className={cn(
                "h-auto flex-col items-start gap-2 p-4 text-left",
                "hover:border-primary hover:bg-primary/5"
              )}
            >
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                <span className="font-semibold">{bookType.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {bookType.description}
              </p>
            </Button>
          );
        })}
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
