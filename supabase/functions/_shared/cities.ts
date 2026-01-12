// City utilities for book creation flow
// Cities are asked as an optional discovery question after resort location
// Now database-driven with caching

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Database record structure (matches cities table)
export interface CityRecord {
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
  og_image: string | null;
  seo_description: string | null;
  is_active: boolean;
  sort_order: number;
}

// Legacy type for backward compatibility
export type ValidCity = string;

// Legacy interface for backward compatibility
export interface CityOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

// Visual profile interface for AI image generation
export interface CityVisualProfile {
  terrain: string;
  architecture: string;
  landmarks: string[];
  colorPalette: string;
  atmosphere: string;
}

// Cache for cities to avoid repeated DB calls
let citiesCache: CityRecord[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache (cities change rarely)

/**
 * Fetch all active cities from the database
 */
export async function fetchCities(
  supabase: SupabaseClient
): Promise<CityRecord[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (citiesCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return citiesCache;
  }

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching cities:', error);
    // Return cached data if available, otherwise fallback
    if (citiesCache) return citiesCache;
    return getDefaultCities();
  }

  citiesCache = data || [];
  cacheTimestamp = now;
  return citiesCache;
}

/**
 * Fallback cities if database is unavailable
 */
function getDefaultCities(): CityRecord[] {
  return [
    { id: 'JERSEY_CITY', label: 'Jersey City', emoji: '🌅', description: 'NJ, waterfront views, diverse neighborhoods', spelling_guide: 'Jersey City (two words)', terrain: 'Hudson River waterfront', architecture: 'Mix of historic brownstones and modern high-rises', landmarks: ['Liberty State Park', 'Exchange Place'], color_palette: 'Urban blues, sunset oranges', atmosphere: 'Diverse, artistic', og_image: '/images/cities/jerseycity-cover.jpeg', seo_description: 'Discover personalized ABC books featuring Jersey City', is_active: true, sort_order: 1 },
    { id: 'HOBOKEN', label: 'Hoboken', emoji: '🚂', description: 'NJ, historic mile-square city', spelling_guide: 'Hoboken (one word)', terrain: 'Compact mile-square city', architecture: 'Classic brownstones', landmarks: ['Hoboken Terminal', 'Washington Street'], color_palette: 'Brick reds, river blues', atmosphere: 'Historic, walkable', og_image: '/images/cities/hoboken-cover.jpeg', seo_description: 'Explore ABC books celebrating Hoboken', is_active: true, sort_order: 2 },
    { id: 'NEW_YORK_CITY', label: 'New York City', emoji: '🗽', description: 'The Big Apple, iconic landmarks', spelling_guide: 'New York City (NYC acceptable)', terrain: 'Manhattan skyline, five boroughs', architecture: 'Iconic skyscrapers, brownstones', landmarks: ['Statue of Liberty', 'Central Park'], color_palette: 'Yellow taxi, urban grays', atmosphere: 'Iconic, energetic', og_image: '/images/cities/newyork-cover.jpeg', seo_description: 'NYC-themed ABC books', is_active: true, sort_order: 3 },
  ];
}

/**
 * Get all valid city IDs from database
 */
export async function getValidCityIds(supabase: SupabaseClient): Promise<string[]> {
  const cities = await fetchCities(supabase);
  return ['NONE', ...cities.map(c => c.id)];
}

/**
 * Type guard for valid city IDs (checks against cached data)
 */
export function isValidCity(value: string): boolean {
  if (value === 'NONE') return true;
  if (!citiesCache) return false;
  return citiesCache.some(c => c.id === value);
}

/**
 * Async type guard that fetches from DB if needed
 */
export async function isValidCityAsync(value: string, supabase: SupabaseClient): Promise<boolean> {
  if (value === 'NONE') return true;
  const cities = await fetchCities(supabase);
  return cities.some(c => c.id === value);
}

/**
 * Get city options for UI display (legacy format)
 */
export async function getCityOptions(supabase: SupabaseClient): Promise<CityOption[]> {
  const cities = await fetchCities(supabase);
  return cities.map(c => ({
    id: c.id,
    label: c.label,
    emoji: c.emoji,
    description: c.description || '',
  }));
}

/**
 * Get city label for display
 */
export async function getCityLabel(cityId: string, supabase: SupabaseClient): Promise<string> {
  if (cityId === 'NONE') return 'No specific city';
  const cities = await fetchCities(supabase);
  const city = cities.find(c => c.id === cityId);
  return city?.label || cityId;
}

/**
 * Get city label synchronously (requires cache to be populated)
 */
export function getCityLabelSync(cityId: string): string {
  if (cityId === 'NONE') return 'No specific city';
  if (!citiesCache) return cityId;
  const city = citiesCache.find(c => c.id === cityId);
  return city?.label || cityId;
}

/**
 * Get city with emoji for display
 */
export async function getCityDisplay(cityId: string, supabase: SupabaseClient): Promise<string> {
  if (cityId === 'NONE') return 'No specific city';
  const cities = await fetchCities(supabase);
  const city = cities.find(c => c.id === cityId);
  return city ? `${city.emoji} ${city.label}` : cityId;
}

/**
 * Get city with emoji synchronously (requires cache to be populated)
 */
export function getCityDisplaySync(cityId: string): string {
  if (cityId === 'NONE') return 'No specific city';
  if (!citiesCache) return cityId;
  const city = citiesCache.find(c => c.id === cityId);
  return city ? `${city.emoji} ${city.label}` : cityId;
}

/**
 * Get visual profile for a city to inject into image generation prompts
 */
export async function getCityVisualProfile(cityId: string, supabase: SupabaseClient): Promise<CityVisualProfile | null> {
  if (cityId === 'NONE') return null;
  
  const cities = await fetchCities(supabase);
  const city = cities.find(c => c.id === cityId);
  
  if (!city || !city.terrain) return null;
  
  return {
    terrain: city.terrain,
    architecture: city.architecture || '',
    landmarks: city.landmarks || [],
    colorPalette: city.color_palette || '',
    atmosphere: city.atmosphere || '',
  };
}

/**
 * Get visual profile synchronously (requires cache to be populated)
 */
export function getCityVisualProfileSync(cityId: string): CityVisualProfile | null {
  if (cityId === 'NONE' || !citiesCache) return null;
  
  const city = citiesCache.find(c => c.id === cityId);
  if (!city || !city.terrain) return null;
  
  return {
    terrain: city.terrain,
    architecture: city.architecture || '',
    landmarks: city.landmarks || [],
    colorPalette: city.color_palette || '',
    atmosphere: city.atmosphere || '',
  };
}

/**
 * Format city visual profile as prompt injection text
 */
export async function getCityVisualPrompt(cityId: string, supabase: SupabaseClient): Promise<string | null> {
  const profile = await getCityVisualProfile(cityId, supabase);
  if (!profile) return null;
  
  const label = await getCityLabel(cityId, supabase);
  
  return `
🏙️ CITY VISUAL REQUIREMENTS FOR ${label.toUpperCase()}:
• TERRAIN/LAYOUT: ${profile.terrain}
• ARCHITECTURE: ${profile.architecture}
• KEY LANDMARKS (include when possible): ${profile.landmarks.join('; ')}
• COLOR PALETTE: ${profile.colorPalette}
• ATMOSPHERE/MOOD: ${profile.atmosphere}

⚠️ DO NOT use generic city imagery. This city has DISTINCT visual identity and neighborhoods.`;
}

/**
 * Format city visual profile synchronously (requires cache to be populated)
 */
export function getCityVisualPromptSync(cityId: string): string | null {
  const profile = getCityVisualProfileSync(cityId);
  if (!profile) return null;
  
  const label = getCityLabelSync(cityId);
  
  return `
🏙️ CITY VISUAL REQUIREMENTS FOR ${label.toUpperCase()}:
• TERRAIN/LAYOUT: ${profile.terrain}
• ARCHITECTURE: ${profile.architecture}
• KEY LANDMARKS (include when possible): ${profile.landmarks.join('; ')}
• COLOR PALETTE: ${profile.colorPalette}
• ATMOSPHERE/MOOD: ${profile.atmosphere}

⚠️ DO NOT use generic city imagery. This city has DISTINCT visual identity and neighborhoods.`;
}

/**
 * Get city record by ID
 */
export async function getCityById(cityId: string, supabase: SupabaseClient): Promise<CityRecord | null> {
  if (cityId === 'NONE') return null;
  const cities = await fetchCities(supabase);
  return cities.find(c => c.id === cityId) || null;
}

/**
 * Get SEO metadata for a city
 */
export async function getCitySeoData(cityId: string, supabase: SupabaseClient): Promise<{
  name: string;
  description: string;
  ogImage: string | null;
} | null> {
  const city = await getCityById(cityId, supabase);
  if (!city) return null;
  
  return {
    name: city.label,
    description: city.seo_description || city.description || '',
    ogImage: city.og_image,
  };
}

/**
 * Initialize the cache - call this at the start of edge function execution
 */
export async function initCitiesCache(supabase: SupabaseClient): Promise<void> {
  await fetchCities(supabase);
}

/**
 * Clears the cache - useful for testing or force refresh
 */
export function clearCitiesCache(): void {
  citiesCache = null;
  cacheTimestamp = 0;
}

// ============================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================

// These maintain compatibility with existing code that imports static arrays
// They will be populated on first fetch and use cached values

export const VALID_CITIES = ['JERSEY_CITY', 'HOBOKEN', 'NEW_YORK_CITY', 'NONE'] as const;

export const CITY_OPTIONS: CityOption[] = [
  { id: 'JERSEY_CITY', label: 'Jersey City', emoji: '🌅', description: 'NJ, waterfront views, diverse neighborhoods' },
  { id: 'HOBOKEN', label: 'Hoboken', emoji: '🚂', description: 'NJ, historic mile-square city' },
  { id: 'NEW_YORK_CITY', label: 'New York City', emoji: '🗽', description: 'The Big Apple, iconic landmarks' },
];
