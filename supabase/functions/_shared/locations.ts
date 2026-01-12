// Location utilities for book creation flow
// Data is now stored in the public.locations table
// This file provides helper functions for working with location data

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

// Type definitions matching the database schema
export interface LocationRecord {
  id: string;
  label: string;
  emoji: string;
  description: string | null;
  spelling_guide: string | null;
  terrain: string | null;
  architecture: string | null;
  landmarks: string[] | null;
  color_palette: string | null;
  atmosphere: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ResortVisualProfile {
  terrain: string;
  architecture: string;
  landmarks: string[];
  colorPalette: string;
  atmosphere: string;
}

// Legacy type for backward compatibility
export type ValidLocation = string;

// Cache for locations to avoid repeated DB calls within a single request
let locationsCache: LocationRecord[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Fetch all active locations from the database
 */
export async function fetchLocations(): Promise<LocationRecord[]> {
  // Return cached data if still valid
  const now = Date.now();
  if (locationsCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return locationsCache;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching locations:', error);
    return [];
  }

  locationsCache = data || [];
  cacheTimestamp = now;
  return locationsCache;
}

/**
 * Get a single location by ID
 */
export async function getLocationById(locationId: string): Promise<LocationRecord | null> {
  const locations = await fetchLocations();
  return locations.find(l => l.id === locationId) || null;
}

/**
 * Type guard for valid location IDs (async version)
 */
export async function isValidLocationAsync(value: string): Promise<boolean> {
  if (value === 'NONE') return true; // NONE is always valid (skipped)
  const location = await getLocationById(value);
  return location !== null;
}

/**
 * Synchronous type guard - checks against known pattern
 * For full validation, use isValidLocationAsync
 */
export function isValidLocation(value: string): value is ValidLocation {
  // Accept any non-empty string that looks like a location ID
  // Full validation should be done with isValidLocationAsync
  return typeof value === 'string' && value.length > 0 && (value === 'NONE' || /^[A-Z_]+$/.test(value));
}

/**
 * Get location label for display
 */
export async function getLocationLabelAsync(locationId: string): Promise<string> {
  const location = await getLocationById(locationId);
  return location?.label || locationId;
}

/**
 * Get location with emoji for display
 */
export async function getLocationDisplayAsync(locationId: string): Promise<string> {
  const location = await getLocationById(locationId);
  return location ? `${location.emoji} ${location.label}` : locationId;
}

// Synchronous versions using cached data (for backward compatibility)
export function getLocationLabel(locationId: ValidLocation): string {
  if (!locationsCache) return locationId;
  const location = locationsCache.find(l => l.id === locationId);
  return location?.label || locationId;
}

export function getLocationDisplay(locationId: ValidLocation): string {
  if (!locationsCache) return locationId;
  const location = locationsCache.find(l => l.id === locationId);
  return location ? `${location.emoji} ${location.label}` : locationId;
}

/**
 * Get spelling guidance for a location
 */
export async function getLocationSpellingGuideAsync(locationId: string): Promise<string | null> {
  const location = await getLocationById(locationId);
  return location?.spelling_guide ? `SPELLING: ${location.spelling_guide}` : null;
}

// Synchronous version using cached data
export function getLocationSpellingGuide(locationId: ValidLocation): string | null {
  if (!locationsCache) return null;
  const location = locationsCache.find(l => l.id === locationId);
  return location?.spelling_guide ? `SPELLING: ${location.spelling_guide}` : null;
}

/**
 * Get visual profile for a resort from database
 */
export async function getResortVisualProfileAsync(locationId: string): Promise<ResortVisualProfile | null> {
  const location = await getLocationById(locationId);
  if (!location || !location.terrain) return null;
  
  return {
    terrain: location.terrain,
    architecture: location.architecture || '',
    landmarks: location.landmarks || [],
    colorPalette: location.color_palette || '',
    atmosphere: location.atmosphere || ''
  };
}

// Synchronous version using cached data
export function getResortVisualProfile(locationId: ValidLocation): ResortVisualProfile | null {
  if (!locationsCache) return null;
  const location = locationsCache.find(l => l.id === locationId);
  if (!location || !location.terrain) return null;
  
  return {
    terrain: location.terrain,
    architecture: location.architecture || '',
    landmarks: location.landmarks || [],
    colorPalette: location.color_palette || '',
    atmosphere: location.atmosphere || ''
  };
}

/**
 * Format resort visual profile as prompt injection text
 */
export async function getResortVisualPromptAsync(locationId: string): Promise<string | null> {
  const location = await getLocationById(locationId);
  if (!location || !location.terrain) return null;
  
  const landmarks = location.landmarks?.join(', ') || 'Various resort landmarks';
  
  return `
🏔️ RESORT VISUAL REQUIREMENTS FOR ${location.label.toUpperCase()}:
• TERRAIN: ${location.terrain}
• ARCHITECTURE: ${location.architecture || 'Resort-appropriate architecture'}
• KEY LANDMARKS (include when possible): ${landmarks}
• COLOR PALETTE: ${location.color_palette || 'Natural mountain colors'}
• ATMOSPHERE/MOOD: ${location.atmosphere || 'Mountain resort atmosphere'}

⚠️ DO NOT use generic alpine/Swiss imagery. This resort has DISTINCT visual identity.`;
}

// Synchronous version using cached data
export function getResortVisualPrompt(locationId: ValidLocation): string | null {
  if (!locationsCache) return null;
  const location = locationsCache.find(l => l.id === locationId);
  if (!location || !location.terrain) return null;
  
  const landmarks = location.landmarks?.join(', ') || 'Various resort landmarks';
  
  return `
🏔️ RESORT VISUAL REQUIREMENTS FOR ${location.label.toUpperCase()}:
• TERRAIN: ${location.terrain}
• ARCHITECTURE: ${location.architecture || 'Resort-appropriate architecture'}
• KEY LANDMARKS (include when possible): ${landmarks}
• COLOR PALETTE: ${location.color_palette || 'Natural mountain colors'}
• ATMOSPHERE/MOOD: ${location.atmosphere || 'Mountain resort atmosphere'}

⚠️ DO NOT use generic alpine/Swiss imagery. This resort has DISTINCT visual identity.`;
}

/**
 * Get all locations formatted for [SUGGEST] block in agent prompts
 */
export async function getLocationSuggestBlock(): Promise<string> {
  const locations = await fetchLocations();
  
  const lines = locations.map(l => `${l.id}: ${l.emoji} ${l.label}`);
  lines.push('SKIP_LOCATION: ⏭️ Skip - No specific location');
  
  return lines.join('\n');
}

/**
 * Initialize the cache - call this at the start of edge function execution
 */
export async function initLocationsCache(): Promise<void> {
  await fetchLocations();
}
