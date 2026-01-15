/**
 * Location Type System for Book Creation
 * Types only - data is fetched from database via useLocations hook
 * @see src/hooks/useLocations.ts for data fetching
 */

// Type for location IDs (dynamic from database)
export type LocationId = string;

// Re-export interface from hook for convenience
export type { LocationRecord, LocationOption } from '@/hooks/useLocations';
