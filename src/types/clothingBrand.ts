/**
 * Clothing Brand Type System for Book Creation
 * Asked as an optional discovery question for character clothing
 */

// Clothing Brand IDs matching backend constants
export const CLOTHING_BRAND_IDS = ['BURTON', 'NONE'] as const;

export type ClothingBrandId = typeof CLOTHING_BRAND_IDS[number];

export interface ClothingBrandOption {
  id: ClothingBrandId;
  label: string;
  emoji: string;
  description: string;
}

// Static clothing brand options
export const CLOTHING_BRAND_OPTIONS: ClothingBrandOption[] = [
  { id: 'BURTON', label: 'Burton', emoji: '🏂', description: 'Burton logos and patterns on clothing' },
  { id: 'NONE', label: 'No brand', emoji: '👕', description: 'Generic clothing without branding' },
];

/**
 * Type guard to check if a string is a valid ClothingBrandId
 */
export function isValidClothingBrand(value: string): value is ClothingBrandId {
  return CLOTHING_BRAND_IDS.includes(value as ClothingBrandId);
}

/**
 * Get display label for a clothing brand ID
 */
export function getClothingBrandLabel(brandId: ClothingBrandId): string {
  const option = CLOTHING_BRAND_OPTIONS.find(b => b.id === brandId);
  return option?.label || brandId;
}

/**
 * Get clothing brand with emoji for display
 */
export function getClothingBrandDisplay(brandId: ClothingBrandId): string {
  const option = CLOTHING_BRAND_OPTIONS.find(b => b.id === brandId);
  return option ? `${option.emoji} ${option.label}` : brandId;
}
