// Clothing Brand constants for book creation flow
// Clothing brands are asked as an optional discovery question for character attire

export const VALID_CLOTHING_BRANDS = ['BURTON', 'NONE'] as const;
export type ValidClothingBrand = typeof VALID_CLOTHING_BRANDS[number];

export interface ClothingBrandOption {
  id: ValidClothingBrand;
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
 * Type guard for valid clothing brand IDs
 */
export function isValidClothingBrand(value: string): value is ValidClothingBrand {
  return VALID_CLOTHING_BRANDS.includes(value as ValidClothingBrand);
}

/**
 * Get clothing brand label for display
 */
export function getClothingBrandLabel(brandId: ValidClothingBrand): string {
  const option = CLOTHING_BRAND_OPTIONS.find(b => b.id === brandId);
  return option?.label || brandId;
}

/**
 * Get clothing brand with emoji for display
 */
export function getClothingBrandDisplay(brandId: ValidClothingBrand): string {
  const option = CLOTHING_BRAND_OPTIONS.find(b => b.id === brandId);
  return option ? `${option.emoji} ${option.label}` : brandId;
}

/**
 * Get prompt injection text for a clothing brand
 * This text should be added to image prompts when clothing is described
 */
export function getClothingBrandPromptInjection(brandId: ValidClothingBrand): string {
  switch (brandId) {
    case 'BURTON':
      return 'Characters wearing clothing should have Burton snowboard brand logos, Burton patterns, or Burton-style designs on their jackets, hoodies, beanies, or other apparel.';
    case 'NONE':
    default:
      return '';
  }
}
