import { useState } from 'react';
import { Search, BookOpen, Users, Gamepad2, GraduationCap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RedditSearchBarProps {
  onSearch: (query: string) => void;
  currentQuery: string;
}

const quickSearches = [
  {
    label: "Educational Discussions",
    query: "ABC alphabet learning early childhood education teaching",
    icon: BookOpen,
    description: "Find educational discussions and teaching strategies"
  },
  {
    label: "Parent Advice",
    query: "toddler preschool alphabet letters reading parenting advice",
    icon: Users,
    description: "Parent experiences and advice about ABC learning"
  },
  {
    label: "Learning Apps & Games",
    query: "educational apps games ABC alphabet children learning digital",
    icon: Gamepad2,
    description: "Digital tools and apps for alphabet learning"
  },
  {
    label: "Teaching Resources",
    query: "curriculum worksheets activities ABC alphabet phonics classroom",
    icon: GraduationCap,
    description: "Resources and materials for educators"
  }
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