/**
 * Grade Level Type System
 * Replaces age-based targeting with educational grade levels
 */

// Grade level IDs matching database table
export const GRADE_IDS = ['PRE_K', 'K', 'GRADE_1', 'GRADE_2'] as const;

export type GradeId = typeof GRADE_IDS[number];

export interface GradeLevel {
  id: GradeId;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Type guard to check if a string is a valid GradeId
 */
export function isValidGrade(value: string): value is GradeId {
  return GRADE_IDS.includes(value as GradeId);
}

/**
 * Get display label for a grade ID
 */
export function getGradeLabel(gradeId: GradeId): string {
  const labels: Record<GradeId, string> = {
    PRE_K: 'Pre-K',
    K: 'Kindergarten',
    GRADE_1: '1st Grade',
    GRADE_2: '2nd Grade',
  };
  return labels[gradeId];
}

/**
 * Get short display label for compact UI
 */
export function getGradeShortLabel(gradeId: GradeId): string {
  const labels: Record<GradeId, string> = {
    PRE_K: 'Pre-K',
    K: 'K',
    GRADE_1: '1st',
    GRADE_2: '2nd',
  };
  return labels[gradeId];
}
