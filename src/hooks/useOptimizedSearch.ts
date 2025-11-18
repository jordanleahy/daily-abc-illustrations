import { useState, useMemo, useTransition } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Optimized Search Hook - Three performance strategies
 * 
 * Strategy 1: Debounced Search (Default)
 * - Delays filtering until user stops typing
 * - Reduces filtering operations by ~80%
 * - Best for: Large datasets (1000+ items)
 * 
 * Strategy 2: Transition-based Search  
 * - Uses React 18 useTransition for non-blocking updates
 * - Keeps UI responsive during filtering
 * - Best for: Medium datasets (100-1000 items)
 * 
 * Strategy 3: Immediate Search
 * - No debounce, filters on every keystroke
 * - Use with well-memoized filter functions
 * - Best for: Small datasets (<100 items)
 * 
 * @param strategy - 'debounced' | 'transition' | 'immediate'
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 */
export function useOptimizedSearch(
  strategy: 'debounced' | 'transition' | 'immediate' = 'debounced',
  debounceMs: number = 300
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // Strategy 1: Debounced search value
  const debouncedQuery = useDebounce(searchQuery, debounceMs);
  
  // Return appropriate search value based on strategy
  const activeQuery = useMemo(() => {
    switch (strategy) {
      case 'debounced':
        return debouncedQuery;
      case 'immediate':
        return searchQuery;
      case 'transition':
        return searchQuery;
      default:
        return debouncedQuery;
    }
  }, [strategy, debouncedQuery, searchQuery]);
  
  // Handle search change with appropriate strategy
  const handleSearchChange = (value: string) => {
    if (strategy === 'transition') {
      startTransition(() => {
        setSearchQuery(value);
      });
    } else {
      setSearchQuery(value);
    }
  };
  
  return {
    searchQuery,
    activeQuery,
    setSearchQuery: handleSearchChange,
    isSearching: strategy === 'debounced' 
      ? searchQuery !== debouncedQuery 
      : isPending,
    rawQuery: searchQuery, // Original unprocessed query for input value
  };
}
