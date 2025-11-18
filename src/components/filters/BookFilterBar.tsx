import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeOption } from '@/utils/themeFilters';
import { cn } from '@/lib/utils';

interface BookFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedThemes: string[];
  onThemesChange: (themes: string[]) => void;
  availableThemes: ThemeOption[];
  showSearch?: boolean;
  showThemeFilter?: boolean;
  placeholder?: string;
}

export const BookFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedThemes,
  onThemesChange,
  availableThemes,
  showSearch = true,
  showThemeFilter = true,
  placeholder = 'Search books...'
}: BookFilterBarProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  
  const toggleTheme = (themeValue: string) => {
    if (selectedThemes.includes(themeValue)) {
      onThemesChange(selectedThemes.filter(t => t !== themeValue));
    } else {
      onThemesChange([...selectedThemes, themeValue]);
    }
  };
  
  const clearAllFilters = () => {
    onSearchChange('');
    onThemesChange([]);
  };
  
  const hasActiveFilters = searchQuery.length > 0 || selectedThemes.length > 0;
  
  const ThemeFilterContent = () => (
    <div className="space-y-4">
      <CommandInput placeholder="Search themes..." />
      <CommandList>
        <CommandEmpty>No themes found</CommandEmpty>
        <CommandGroup>
          {availableThemes.map(theme => (
            <CommandItem
              key={theme.value}
              onSelect={() => toggleTheme(theme.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedThemes.includes(theme.value)}
                onCheckedChange={() => toggleTheme(theme.value)}
              />
              <span>{theme.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </div>
  );
  
  return (
    <div className="space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">
      {/* Search Input */}
      {showSearch && (
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      
      {/* Theme Filter - Desktop: Popover, Mobile: Sheet */}
      {showThemeFilter && (
        <>
          {isMobile ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Themes
                  {selectedThemes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedThemes.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Filter by Theme</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <Command>
                    <ThemeFilterContent />
                  </Command>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Themes
                  {selectedThemes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedThemes.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <ThemeFilterContent />
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </>
      )}
      
      {/* Clear All Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};
