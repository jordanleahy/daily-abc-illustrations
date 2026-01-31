import { useState } from 'react';
import { Search, Filter, X, ShoppingBag } from 'lucide-react';
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
  // Etsy filter props (admin-only)
  etsyFilter?: boolean;
  onEtsyFilterChange?: (enabled: boolean) => void;
  showEtsyFilter?: boolean;
}

export const BookFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedThemes,
  onThemesChange,
  availableThemes,
  showSearch = true,
  showThemeFilter = true,
  placeholder = 'Search books...',
  etsyFilter = false,
  onEtsyFilterChange,
  showEtsyFilter = false
}: BookFilterBarProps) => {
  const isMobile = useIsMobile();
  const [themeOpen, setThemeOpen] = useState(false);
  const [etsyOpen, setEtsyOpen] = useState(false);
  
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
    onEtsyFilterChange?.(false);
  };
  
  const hasActiveFilters = searchQuery.length > 0 || selectedThemes.length > 0 || etsyFilter;
  
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

  const EtsyFilterContent = () => (
    <div className="space-y-4 p-2">
      <div
        className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-accent"
        onClick={() => onEtsyFilterChange?.(!etsyFilter)}
      >
        <Checkbox
          checked={etsyFilter}
          onCheckedChange={(checked) => onEtsyFilterChange?.(!!checked)}
        />
        <div className="flex flex-col">
          <span className="font-medium">Not on Etsy</span>
          <span className="text-sm text-muted-foreground">Show only books not listed on Etsy</span>
        </div>
      </div>
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
            <Sheet open={themeOpen} onOpenChange={setThemeOpen}>
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
            <Popover open={themeOpen} onOpenChange={setThemeOpen}>
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

      {/* Etsy Filter - Desktop: Popover, Mobile: Sheet */}
      {showEtsyFilter && (
        <>
          {isMobile ? (
            <Sheet open={etsyOpen} onOpenChange={setEtsyOpen}>
              <SheetTrigger asChild>
                <Button variant={etsyFilter ? "default" : "outline"} className="w-full md:w-auto">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Etsy
                  {etsyFilter && (
                    <Badge variant="secondary" className="ml-2 bg-background/20">
                      1
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[50vh]">
                <SheetHeader>
                  <SheetTitle>Filter by Etsy Status</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <EtsyFilterContent />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Popover open={etsyOpen} onOpenChange={setEtsyOpen}>
              <PopoverTrigger asChild>
                <Button variant={etsyFilter ? "default" : "outline"}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Etsy
                  {etsyFilter && (
                    <Badge variant="secondary" className="ml-2 bg-background/20">
                      1
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <EtsyFilterContent />
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
