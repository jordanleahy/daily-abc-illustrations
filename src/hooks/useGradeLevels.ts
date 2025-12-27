import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GradeLevel, GradeId } from '@/types/grade';
import { GRADE_IDS } from '@/types/grade';

const GRADE_LEVELS_KEY = ['grade-levels'];

/**
 * Hook to fetch grade levels from database
 * Falls back to hardcoded values if database is unavailable
 */
export function useGradeLevels() {
  return useQuery({
    queryKey: GRADE_LEVELS_KEY,
    queryFn: async (): Promise<GradeLevel[]> => {
      const { data, error } = await supabase
        .from('grade_levels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Failed to fetch grade levels:', error);
        // Return fallback data
        return getDefaultGradeLevels();
      }
      
      return data as GradeLevel[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
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
 * Validate if a string is a valid grade ID
 */
export function isValidGradeId(id: string): id is GradeId {
  return GRADE_IDS.includes(id as GradeId);
}
