import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RedditSearchBarProps {
  onSearch: (query: string) => void;
  currentQuery: string;
}

const quickSearches = [
  'ABC Help',
  'Letter Learning',
  'Phonics Activities',
  'Alphabet Games',
  'Reading Readiness'
];

export const RedditSearchBar = ({ onSearch, currentQuery }: RedditSearchBarProps) => {
  const [searchInput, setSearchInput] = useState(currentQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchInput(query);
    onSearch(query);
  };

  return (
    <div className="mb-6 space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search for ABC learning topics..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={!searchInput.trim()}>
          Search
        </Button>
      </form>
      
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Quick searches:</span>
        {quickSearches.map((query) => (
          <Button
            key={query}
            variant="outline"
            size="sm"
            onClick={() => handleQuickSearch(query)}
            className="text-xs"
          >
            {query}
          </Button>
        ))}
      </div>
      
      {currentQuery && (
        <div className="text-sm text-muted-foreground">
          Showing results for: <span className="font-medium">"{currentQuery}"</span>
        </div>
      )}
    </div>
  );
};