/**
 * Type-safe enum for age ranges
 * Synced with backend VALID_AGE_RANGES in supabase/functions/_shared/types.ts
 */
export const AGE_RANGE_IDS = [
  '0-2',
  '2-4',
  '4-6',
  '6-8',
  '8-10',
  '10-12',
  'other'
] as const;

export type AgeRangeId = typeof AGE_RANGE_IDS[number];

/**
 * Validates if a value is a valid age range
 * @param value - Value to check
 * @returns true if value is a valid AgeRangeId
 */
export function isValidAgeRange(value: unknown): value is AgeRangeId {
  return typeof value === 'string' && AGE_RANGE_IDS.includes(value as AgeRangeId);
}

/**
 * Normalizes and validates an age range string
 * @param ageRange - Age range string to normalize
 * @returns Validated AgeRangeId or undefined if invalid
 */
export function normalizeAgeRange(ageRange: string | undefined): AgeRangeId | undefined {
  if (!ageRange) return undefined;
  
  // Convert to lowercase and trim
  const normalized = ageRange.toLowerCase().trim();
  
  // Validate against known ranges
  if (isValidAgeRange(normalized)) {
    return normalized;
  }
  
  // Try to extract numbers and format (e.g., "2 to 4" -> "2-4")
  const numbers = normalized.match(/(\d+)/g);
  if (numbers && numbers.length >= 2) {
    const formatted = `${numbers[0]}-${numbers[1]}`;
    if (isValidAgeRange(formatted)) {
      return formatted;
    }
  }
  
  console.warn(`[Age Range Validation] Invalid age range: "${ageRange}", normalized to: "${normalized}"`);
  return undefined;
}

/**
 * Gets display-friendly label for an age range
 * @param ageRangeId - Age range ID
 * @returns Human-readable label
 */
export function getAgeRangeDisplayName(ageRangeId: AgeRangeId): string {
  if (ageRangeId === 'other') return 'Other';
  
  const [min, max] = ageRangeId.split('-');
  return `${min}-${max} years`;
}
