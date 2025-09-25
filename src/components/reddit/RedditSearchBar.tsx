import { useState } from 'react';
import { Search, BookOpen, Users, Gamepad2, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RedditSearchBarProps {
  onSearch: (query: string, timeFilter?: string) => void;
  currentQuery: string;
}

const quickSearches = [
  {
    label: "Alphabet Activities",
    query: "alphabet activities for preschool",
    icon: BookOpen,
    description: "Find hands-on alphabet learning activities"
  },
  {
    label: "Phonics Games",
    query: "phonics games for kindergarten",
    icon: Gamepad2,
    description: "Discover phonics games and activities"
  },
  {
    label: "Letter Tracing Tips",
    query: "how to teach letter tracing to children",
    icon: GraduationCap,
    description: "Get advice on teaching letter formation"
  },
  {
    label: "Early Childhood Education",
    query: "ABC learning for kids early childhood",
    icon: Users,
    description: "Explore early learning discussions and tips"
  }
];

export const RedditSearchBar = ({ onSearch, currentQuery }: RedditSearchBarProps) => {
  const [searchInput, setSearchInput] = useState(currentQuery);
  const [timeFilter, setTimeFilter] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim(), timeFilter || undefined);
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchInput(query);
    onSearch(query, timeFilter || undefined);
  };

  return (
    <div className="mb-6 space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for ABC learning topics (e.g. 'alphabet games for preschool')"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant={timeFilter === '48h' ? 'default' : 'outline'} 
          size="sm"
          type="button"
          onClick={() => {
            const newFilter = timeFilter === '48h' ? '' : '48h';
            setTimeFilter(newFilter);
            if (searchInput.trim()) {
              onSearch(searchInput.trim(), newFilter || undefined);
            }
          }}
          className="whitespace-nowrap"
        >
          {timeFilter === '48h' ? 'Last 48h ✓' : 'Last 48h'}
        </Button>
        <Button type="submit" disabled={!searchInput.trim()}>
          Search
        </Button>
      </form>

      {/* Quick Search Options */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Quick Searches:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {quickSearches.map((search) => {
            const IconComponent = search.icon;
            return (
              <Button
                key={search.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSearch(search.query)}
                className="flex items-center gap-2 h-auto p-3 text-left"
                title={search.description}
              >
                <IconComponent className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{search.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
      
      {currentQuery && (
        <div className="text-sm text-muted-foreground">
          Showing results for: <span className="font-medium">"{currentQuery}"</span>
        </div>
      )}
    </div>
  );
};