import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

export interface AgeGroup {
  id: string;
  label: string;
  min_age: number;
  max_age: number;
  sort_order: number;
  is_active: boolean;
}

// In-memory cache for age groups
let cachedAgeGroups: AgeGroup[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches age groups from database with in-memory caching
 * Cache is refreshed on cold start or after TTL expires
 */
export async function fetchAgeGroups(): Promise<AgeGroup[]> {
  const now = Date.now();
  
  // Return cached data if valid
  if (cachedAgeGroups && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedAgeGroups;
  }
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('age_groups')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Failed to fetch age groups:', error);
    // Return fallback if cache exists
    if (cachedAgeGroups) return cachedAgeGroups;
    // Return hardcoded fallback
    return getDefaultAgeGroups();
  }
  
  cachedAgeGroups = data as AgeGroup[];
  cacheTimestamp = now;
  
  console.log(`✅ Age groups loaded: ${cachedAgeGroups.length} groups`);
  return cachedAgeGroups;
}

/**
 * Generates [SUGGEST] block format for age group selection in chat
 */
export async function getAgeGroupSuggestions(): Promise<string> {
  const ageGroups = await fetchAgeGroups();
  
  const suggestions = ageGroups
    .map(ag => `${ag.id}: ${ag.label}`)
    .join('\n');
  
  return `[SUGGEST]\n${suggestions}\n[/SUGGEST]`;
}

/**
 * Fallback age groups if database is unavailable
 */
function getDefaultAgeGroups(): AgeGroup[] {
  return [
    { id: '0-2', label: '0-2 years', min_age: 0, max_age: 2, sort_order: 1, is_active: true },
    { id: '2-4', label: '2-4 years', min_age: 2, max_age: 4, sort_order: 2, is_active: true },
    { id: '4-6', label: '4-6 years', min_age: 4, max_age: 6, sort_order: 3, is_active: true },
    { id: '6-8', label: '6-8 years', min_age: 6, max_age: 8, sort_order: 4, is_active: true },
    { id: '8-10', label: '8-10 years', min_age: 8, max_age: 10, sort_order: 5, is_active: true },
    { id: '10-12', label: '10-12 years', min_age: 10, max_age: 12, sort_order: 6, is_active: true },
  ];
}

/**
 * Clears the cache - useful for testing or force refresh
 */
export function clearAgeGroupCache(): void {
  cachedAgeGroups = null;
  cacheTimestamp = 0;
}
