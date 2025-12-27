import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

export const VALID_GRADES = ['PRE_K', 'K', 'GRADE_1', 'GRADE_2'] as const;
export type ValidGrade = typeof VALID_GRADES[number];

export interface GradeLevel {
  id: ValidGrade;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

// In-memory cache for grade levels
let cachedGradeLevels: GradeLevel[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Type guard for valid grade IDs
 */
export function isValidGrade(value: string): value is ValidGrade {
  return VALID_GRADES.includes(value as ValidGrade);
}

/**
 * Fetches grade levels from database with in-memory caching
 */
export async function fetchGradeLevels(): Promise<GradeLevel[]> {
  const now = Date.now();
  
  // Return cached data if valid
  if (cachedGradeLevels && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedGradeLevels;
  }
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('grade_levels')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Failed to fetch grade levels:', error);
    if (cachedGradeLevels) return cachedGradeLevels;
    return getDefaultGradeLevels();
  }
  
  cachedGradeLevels = data as GradeLevel[];
  cacheTimestamp = now;
  
  console.log(`✅ Grade levels loaded: ${cachedGradeLevels.length} grades`);
  return cachedGradeLevels;
}

/**
 * Generates [SUGGEST] block format for grade selection in chat
 */
export async function getGradeSuggestions(): Promise<string> {
  const gradeLevels = await fetchGradeLevels();
  
  const suggestions = gradeLevels
    .map(gl => `${gl.id}: ${gl.label}`)
    .join('\n');
  
  return `[SUGGEST]\n${suggestions}\n[/SUGGEST]`;
}

/**
 * Fallback grade levels if database is unavailable
 */
function getDefaultGradeLevels(): GradeLevel[] {
  return [
    { id: 'PRE_K', label: 'Pre-K', description: 'Pre-Kindergarten (Ages 3-4)', sort_order: 1, is_active: true },
    { id: 'K', label: 'Kindergarten', description: 'Kindergarten (Ages 5-6)', sort_order: 2, is_active: true },
    { id: 'GRADE_1', label: '1st Grade', description: 'First Grade (Ages 6-7)', sort_order: 3, is_active: true },
    { id: 'GRADE_2', label: '2nd Grade', description: 'Second Grade (Ages 7-8)', sort_order: 4, is_active: true },
  ];
}

/**
 * Get grade label for display
 */
export function getGradeLabel(gradeId: ValidGrade): string {
  const labels: Record<ValidGrade, string> = {
    PRE_K: 'Pre-K',
    K: 'Kindergarten',
    GRADE_1: '1st Grade',
    GRADE_2: '2nd Grade',
  };
  return labels[gradeId];
}

/**
 * Clears the cache - useful for testing
 */
export function clearGradeLevelCache(): void {
  cachedGradeLevels = null;
  cacheTimestamp = 0;
}
