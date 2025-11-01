import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { BOOK_TYPES } from '@/config/bookTypes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmptyStateProps {
  onBookTypeSelect: (bookType: typeof BOOK_TYPES[0]) => void;
  isLoading: boolean;
}

export const EmptyState = memo(function EmptyState({ 
  onBookTypeSelect, 
  isLoading 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-2" />
          <h2 className="text-2xl font-bold">What would you like to create?</h2>
          <p className="text-muted-foreground">
            Choose a book type below or describe your own custom idea
          </p>
        </div>

        {/* Book Type Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <TooltipProvider>
            {BOOK_TYPES.map((bookType) => {
              const IconComponent = bookType.icon;
              return (
                <Tooltip key={bookType.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => onBookTypeSelect(bookType)}
                      disabled={isLoading}
                      className="h-auto flex flex-col items-center gap-3 p-4 hover:bg-accent hover:scale-105 transition-all"
                    >
                      <IconComponent className={`h-8 w-8 ${bookType.color}`} />
                      <span className="text-sm font-medium text-center leading-tight">
                        {bookType.label}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{bookType.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or describe your own idea
            </span>
          </div>
        </div>

        {/* Example prompt */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Example: "Create an ABC book about dinosaurs" or "Numbers book with space theme"
          </p>
        </div>
      </div>
    </div>
  );
});
