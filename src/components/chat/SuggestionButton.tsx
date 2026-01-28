import { memo, useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { SuggestedAction } from '@/hooks/useGoogleChat';

interface SuggestionButtonProps {
  action: SuggestedAction;
  onClick: () => void;
}

/**
 * Parses a suggestion label to extract title and description.
 * Handles formats like:
 * - "Physical Opposites (big/small, tall/short)" -> { title: "Physical Opposites", description: "big/small, tall/short" }
 * - "🌟 Adventure & Exploration" -> { title: "Adventure & Exploration", description: null }
 * - "lowercase letters (a, b, c)" -> { title: "lowercase letters", description: "a, b, c" }
 */
function parseLabel(label: string): { title: string; description: string | null } {
  // Remove emoji prefixes for cleaner display
  const cleanLabel = label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  
  // Check for parenthetical content: "Title (description)" or "Title: description"
  const parentheticalMatch = cleanLabel.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (parentheticalMatch) {
    return {
      title: parentheticalMatch[1].trim(),
      description: parentheticalMatch[2].trim(),
    };
  }
  
  // Check for colon separator: "Title: description"
  const colonMatch = cleanLabel.match(/^(.+?):\s+(.+)$/);
  if (colonMatch && colonMatch[2].length > 15) {
    return {
      title: colonMatch[1].trim(),
      description: colonMatch[2].trim(),
    };
  }
  
  return { title: cleanLabel, description: null };
}

export const SuggestionButton = memo(({ action, onClick }: SuggestionButtonProps) => {
  const { title, description } = parseLabel(action.label);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // If no description, render simple button
  if (!description) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className="text-xs w-full justify-center"
      >
        {title}
      </Button>
    );
  }
  
  // With description, render button with info icon
  return (
    <div className="flex items-center gap-1 w-full">
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        className="text-xs flex-1 justify-center"
      >
        {title}
      </Button>
      
      {/* Desktop: Tooltip on hover */}
      <div className="hidden sm:block">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-md",
                  "text-muted-foreground hover:text-foreground hover:bg-accent",
                  "transition-colors"
                )}
                aria-label="Show details"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Mobile: Popover on tap */}
      <div className="sm:hidden">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-md",
                "text-muted-foreground hover:text-foreground hover:bg-accent",
                "transition-colors"
              )}
              aria-label="Show details"
            >
              <Info className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto max-w-xs p-2">
            <p className="text-xs text-muted-foreground">{description}</p>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});

SuggestionButton.displayName = 'SuggestionButton';
