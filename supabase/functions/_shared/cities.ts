// City utilities for book creation flow
// Cities are asked as an optional discovery question after resort location
// Now database-driven with caching, including rich landmark details

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

// Database record structure for city landmarks
export interface CityLandmark {
  id: string;
  city_id: string;
  name: string;
  type: string;
  description: string;
  visual_cues: string[];
  is_major: boolean;
  sort_order: number;
  is_active: boolean;
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

// Cache for landmarks by city
const landmarksCache: Map<string, CityLandmark[]> = new Map();
let landmarksCacheTimestamp: number = 0;

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
 * Fetch landmarks for a specific city
 */
export async function fetchCityLandmarks(
  cityId: string,
  supabase: SupabaseClient
): Promise<CityLandmark[]> {
  const now = Date.now();
  
  // Check cache
  if ((now - landmarksCacheTimestamp) < CACHE_TTL_MS && landmarksCache.has(cityId)) {
    return landmarksCache.get(cityId) || [];
  }

  const { data, error } = await supabase
    .from('city_landmarks')
    .select('*')
    .eq('city_id', cityId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching landmarks:', error);
    return [];
  }

  landmarksCache.set(cityId, data || []);
  landmarksCacheTimestamp = now;
  return data || [];
}

/**
 * Format landmarks into rich prompt text grouped by type
 */
function formatLandmarksForPrompt(landmarks: CityLandmark[]): string {
  if (!landmarks.length) return '';

  // Group by type
  const byType = new Map<string, CityLandmark[]>();
  for (const lm of landmarks) {
    const existing = byType.get(lm.type) || [];
    existing.push(lm);
    byType.set(lm.type, existing);
  }

  const typeLabels: Record<string, string> = {
    park: '🌳 PARKS',
    cafe: '☕ CAFES & EATERIES',
    street: '🛤️ STREETS & PLAZAS',
    neighborhood: '🏘️ NEIGHBORHOODS',
    landmark: '🏛️ LANDMARKS',
    venue: '🎭 VENUES',
  };

  const sections: string[] = [];
  for (const [type, lms] of byType) {
    const header = typeLabels[type] || type.toUpperCase();
    const items = lms.map(lm => {
      const cues = lm.visual_cues.length ? `\n    Visual cues: ${lm.visual_cues.join(', ')}` : '';
      return `  • ${lm.name}: ${lm.description}${cues}`;
    });
    sections.push(`${header}:\n${items.join('\n')}`);
  }

  return sections.join('\n\n');
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
 * Resolve a raw city token (e.g. "CITY_NEW_YORK_CITY", "CITY_CUSTOM",
 * "CITY_CUSTOM:Paris") to a human-readable label suitable for the cover
 * prompt and the saved book title.
 *
 * Rules:
 *  - "NONE" / empty / null → null (no city)
 *  - "CITY_CUSTOM:<label>" → "<label>" (freeform user input, title-cased)
 *  - "CITY_CUSTOM" alone   → null (unresolved, refuse to leak token)
 *  - Known DB id           → cities[].label
 *  - Unknown "CITY_FOO_BAR" fallback → "Foo Bar" (strip prefix, title-case)
 *  - Anything else         → the input string as-is (already a label)
 *
 * NEVER returns a string starting with "CITY_" — the whole point of this
 * function is to keep that token out of `books.book_name` and cover art.
 */
export function resolveCityToken(rawCity?: string | null): string | null {
  if (!rawCity) return null;
  const value = String(rawCity).trim();
  if (!value || value === 'NONE' || value === 'skip-city') return null;

  // Freeform custom city carried as "CITY_CUSTOM:<user text>"
  if (value.startsWith('CITY_CUSTOM:')) {
    const custom = value.slice('CITY_CUSTOM:'.length).trim();
    return custom ? titleCase(custom) : null;
  }
  // Bare "CITY_CUSTOM" with no payload — refuse to leak the token.
  if (value === 'CITY_CUSTOM') return null;

  // Known DB id — use its human label from the cache.
  if (citiesCache) {
    const city = citiesCache.find(c => c.id === value);
    if (city?.label) return city.label;
  }

  // Unknown CITY_* id: strip prefix, title-case underscores.
  if (value.startsWith('CITY_')) {
    return titleCase(value.slice('CITY_'.length).replace(/_/g, ' '));
  }

  // Not a token — assume it's already a human label.
  return value;
}

function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
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
 * Format city visual profile as prompt injection text with rich landmark details
 */
export async function getCityVisualPrompt(cityId: string, supabase: SupabaseClient): Promise<string | null> {
  const profile = await getCityVisualProfile(cityId, supabase);
  if (!profile) return null;
  
  const label = await getCityLabel(cityId, supabase);
  const landmarks = await fetchCityLandmarks(cityId, supabase);
  const landmarkSection = formatLandmarksForPrompt(landmarks);
  
  return `
🏙️ CITY VISUAL REQUIREMENTS FOR ${label.toUpperCase()}:
• TERRAIN/LAYOUT: ${profile.terrain}
• ARCHITECTURE: ${profile.architecture}
• COLOR PALETTE: ${profile.colorPalette}
• ATMOSPHERE/MOOD: ${profile.atmosphere}

📍 LOCAL LANDMARKS & SETTINGS (use these for authentic backgrounds):
${landmarkSection || `  • ${profile.landmarks.join('; ')}`}

⚠️ DO NOT use generic city imagery. This city has DISTINCT visual identity. Use the specific landmarks above for authentic, locally-recognizable scenes.`;
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

/**
 * Build a dynamic SUGGEST block for city selection from database
 * Used in chat agent to show available city options
 */
export async function getCitySuggestBlock(supabase: SupabaseClient): Promise<string> {
  const cities = await fetchCities(supabase);
  
  const cityLines = cities.map(city => 
    `${city.id}: ${city.emoji} ${city.label}`
  );
  
  // Add skip option
  cityLines.push('skip-city: ⏭️ Skip (no specific city)');
  
  return cityLines.join('\n');
}

// ---------------------------------------------------------------------------
// Ground-truth enrichment: resolve any city (predetermined OR freeform) to a
// canonical Google Place + nearby landmarks + short Wikipedia summary and
// return a prompt block. Uses in-memory cache per invocation to avoid repeat
// network hops for the same label.
// ---------------------------------------------------------------------------

interface CityGroundTruth {
  label: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  types?: string[];
  landmarks: Array<{ name: string; type: string; description?: string }>;
  wikipediaSummary?: string;
}

const groundTruthCache = new Map<string, CityGroundTruth | null>();

async function geocodeCityViaPlaces(label: string, apiKey: string): Promise<{
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  types: string[];
} | null> {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.formattedAddress,places.location,places.types,places.displayName',
      },
      body: JSON.stringify({
        textQuery: label,
        includedType: 'locality',
        maxResultCount: 1,
      }),
    });
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;
    return {
      placeId: place.id,
      formattedAddress: place.formattedAddress || label,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude,
      types: place.types || [],
    };
  } catch (err) {
    console.warn('[CityGroundTruth] geocode failed:', err);
    return null;
  }
}

async function fetchNearbyLandmarksFromPlaces(
  lat: number,
  lng: number,
  apiKey: string
): Promise<Array<{ name: string; type: string; description?: string; rating: number; ratingCount: number }>> {
  const buckets = [
    ['park', 'national_park'],
    ['historical_landmark', 'monument', 'tourist_attraction'],
    ['museum', 'art_gallery', 'performing_arts_theater'],
  ];
  const all: any[] = [];
  await Promise.all(buckets.map(async (types) => {
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.types,places.editorialSummary,places.rating,places.userRatingCount',
        },
        body: JSON.stringify({
          includedTypes: types,
          maxResultCount: 8,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 8000 } },
          rankPreference: 'POPULARITY',
        }),
      });
      const data = await res.json();
      for (const p of data?.places || []) {
        all.push({
          id: p.id,
          name: p.displayName?.text || '',
          type: (p.types?.[0] || 'landmark').replace(/_/g, ' '),
          description: p.editorialSummary?.text || '',
          rating: p.rating || 0,
          ratingCount: p.userRatingCount || 0,
        });
      }
    } catch (err) {
      console.warn('[CityGroundTruth] nearby search failed:', err);
    }
  }));
  // Dedup by id, sort by popularity, cap 10
  const seen = new Set<string>();
  const unique = all.filter(p => p.name && !seen.has(p.id) && seen.add(p.id));
  unique.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
  return unique.slice(0, 10);
}

async function fetchWikipediaSummary(label: string): Promise<string | undefined> {
  try {
    const title = encodeURIComponent(label.replace(/\s+/g, '_'));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { 'accept': 'application/json', 'user-agent': 'ChairliftHabits/1.0 (books)' },
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    const extract: string | undefined = data?.extract;
    if (!extract) return undefined;
    // Cap to ~600 chars to keep prompt lean
    return extract.length > 600 ? extract.slice(0, 600).trim() + '…' : extract;
  } catch (err) {
    console.warn('[CityGroundTruth] wikipedia fetch failed:', err);
    return undefined;
  }
}

/**
 * Resolve a raw city token (predetermined DB id OR freeform CITY_CUSTOM:label)
 * to a canonical Google Place, pull top nearby landmarks, and grab a short
 * Wikipedia summary. Returns a prompt-ready block that can be appended to
 * illustration-director / graphic-designer / cover prompts.
 *
 * Combines with existing DB-backed visual profile when available.
 */
export async function getCityGroundTruthPromptAsync(
  rawCity: string | null | undefined,
  supabase: SupabaseClient
): Promise<string | null> {
  const label = resolveCityToken(rawCity ?? null);
  if (!label) return null;

  // Start from existing DB visual prompt if this is a known city id
  let dbBlock: string | null = null;
  if (rawCity && isValidCity(rawCity)) {
    dbBlock = await getCityVisualPrompt(rawCity, supabase);
  }

  // Cache per label
  const cacheKey = label.toLowerCase();
  let ground: CityGroundTruth | null;
  if (groundTruthCache.has(cacheKey)) {
    ground = groundTruthCache.get(cacheKey) ?? null;
  } else {
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    let landmarks: CityGroundTruth['landmarks'] = [];
    let geocoded: Awaited<ReturnType<typeof geocodeCityViaPlaces>> = null;
    if (apiKey) {
      geocoded = await geocodeCityViaPlaces(label, apiKey);
      if (geocoded?.latitude && geocoded?.longitude) {
        const nearby = await fetchNearbyLandmarksFromPlaces(geocoded.latitude, geocoded.longitude, apiKey);
        landmarks = nearby.map(l => ({ name: l.name, type: l.type, description: l.description }));
      }
    } else {
      console.warn('[CityGroundTruth] GOOGLE_API_KEY missing — skipping Places lookup');
    }
    const wiki = await fetchWikipediaSummary(label);
    ground = {
      label,
      formattedAddress: geocoded?.formattedAddress,
      latitude: geocoded?.latitude,
      longitude: geocoded?.longitude,
      types: geocoded?.types,
      landmarks,
      wikipediaSummary: wiki,
    };
    groundTruthCache.set(cacheKey, ground);
  }

  if (!ground) return dbBlock;

  const parts: string[] = [];
  if (dbBlock) parts.push(dbBlock.trim());

  const gtLines: string[] = [];
  gtLines.push(`\n🌐 CANONICAL PLACE (ground truth for ${ground.label.toUpperCase()}):`);
  if (ground.formattedAddress) gtLines.push(`• Resolved location: ${ground.formattedAddress}`);
  if (ground.latitude && ground.longitude) gtLines.push(`• Coordinates: ${ground.latitude.toFixed(4)}, ${ground.longitude.toFixed(4)}`);

  if (ground.wikipediaSummary) {
    gtLines.push(`\n📖 CULTURAL CONTEXT (from Wikipedia, use for atmosphere/culture cues — do NOT quote verbatim):`);
    gtLines.push(ground.wikipediaSummary);
  }

  if (ground.landmarks.length) {
    gtLines.push(`\n📍 REAL NEARBY LANDMARKS (use ONLY these named places for authentic backgrounds — do not invent):`);
    for (const lm of ground.landmarks) {
      const desc = lm.description ? ` — ${lm.description}` : '';
      gtLines.push(`  • ${lm.name} (${lm.type})${desc}`);
    }
  }

  gtLines.push(`\n⚠️ GROUNDING RULES: Prefer the named landmarks above over generic scenery. Reflect the cultural context in signage, food, clothing, and street life. Do NOT hallucinate landmarks that are not listed. Never render the raw token "CITY_CUSTOM" or any "CITY_*" string in the illustration.`);

  parts.push(gtLines.join('\n'));
  return parts.join('\n');
}

