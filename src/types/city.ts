/**
 * City Type System for Book Creation
 * Types only - data is fetched from database via useCities hook
 * @see src/hooks/useCities.ts for data fetching
 */

// Type for city IDs (dynamic from database)
export type CityId = string;

// Re-export interfaces from hook for convenience
export type { City, CityOption } from '@/hooks/useCities';
