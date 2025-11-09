/**
 * Safe Space Configuration for Image Generation
 * Defines aspect-ratio-specific composition rules to prevent edge-touching elements
 * 
 * USER EXPERIENCE:
 * As a user, when I request an aspect ratio image type, this system automatically
 * appends the appropriate composition rules to my prompt, eliminating the need
 * to manually specify safe margins and preventing prompt bloat.
 * 
 * ANTI-BLOAT BENEFITS:
 * - Removes redundant safe space instructions from user prompts and system prompts
 * - Automatically applies aspect-ratio-specific composition rules
 * - Creates single source of truth for safe zone requirements
 * - Ensures consistent margin enforcement across all image generation workflows
 * 
 * WORKFLOW:
 * 1. User provides base prompt with desired aspect ratio
 * 2. System automatically appends safe space rules via appendSafeSpaceRules()
 * 3. Enhanced prompt sent to image generation API with proper composition constraints
 * 4. Generated images respect safe boundaries without manual specification
 * 
 * INTEGRATION POINTS:
 * - bulk-generate-prompts: Applied to generated prompts before return
 * - bulk-image-generation: Applied during batch processing
 * - All image generation workflows: Ensures consistent safe space enforcement
 */

export interface SafeSpaceConfig {
  aspectRatio: string;
  description: string;
  safeZones: string;
  composition: string;
  negativePrompts: string;
}

const SAFE_SPACE_CONFIGS: Record<string, SafeSpaceConfig> = {
  '1:1': {
    aspectRatio: '1:1 Square Format',
    description: 'Centered layout with balanced margins on all sides and protected bottom zone for text overlay',
    safeZones: 'Maintain balanced 18-20% margins on all sides, especially TOP MARGIN for letter-based content. CRITICAL: Keep bottom 8-10% (minimum 40px) completely clear for text overlay',
    composition: 'Centered layout with generous breathing room from top edge, well-framed central focus. All important visual elements must stay in the top 90% of the image to preserve space for bottom text overlay',
    negativePrompts: 'No corner-to-corner compositions, maintain balanced spacing, no edge-hugging elements, NEVER allow letters to touch or get close to the top edge, no cramped letter positioning, CRITICAL: no important content in bottom 10% of image, keep bottom safe zone clear for text overlay'
  },
  '16:9': {
    aspectRatio: '16:9 Landscape Format',
    description: 'Wide horizontal layout with proper safe boundaries',
    safeZones: 'Maintain 15-20% margins on left and right sides, 10% margins on top and bottom',
    composition: 'Wide horizontal layout with workflow elements well within safe boundaries',
    negativePrompts: 'No cramped horizontal layouts, no elements touching left/right edges, no edge-to-edge content'
  },
  '9:16': {
    aspectRatio: '9:16 Portrait Format',
    description: 'Vertical orientation with generous breathing room',
    safeZones: 'Maintain 12-15% margins on top and bottom, 8-10% margins on left and right sides',
    composition: 'Vertical orientation with generous breathing room',
    negativePrompts: 'No elements touching top/bottom edges, maintain vertical breathing room, no cramped vertical layouts'
  },
  '4:3': {
    aspectRatio: '4:3 Standard Format',
    description: 'Balanced horizontal spacing with proper frame margins',
    safeZones: 'Maintain 12% margins on left and right, 10% margins on top and bottom',
    composition: 'Balanced horizontal spacing with proper frame margins',
    negativePrompts: 'No cramped compositions, no elements touching frame borders, maintain horizontal balance'
  },
  '3:4': {
    aspectRatio: '3:4 Portrait Format',
    description: 'Optimized for social media viewing with proper vertical spacing',
    safeZones: 'Maintain 10-12% margins on top and bottom, 8% margins on left and right sides',
    composition: 'Optimized for social media viewing with proper vertical spacing',
    negativePrompts: 'No elements touching edges, maintain social media safe zones, no cramped vertical content'
  },
  '4:5': {
    aspectRatio: '4:5 Portrait Format',
    description: 'Moderately tall portrait layout ideal for print and digital display',
    safeZones: 'Maintain 12-15% margins on top and bottom, 10% margins on left and right sides',
    composition: 'Moderately tall portrait with well-balanced vertical composition',
    negativePrompts: 'No elements touching top/bottom edges, maintain balanced vertical spacing, no cramped portrait layouts'
  },
  '3:2': {
    aspectRatio: '3:2 Social Media Format',
    description: 'Social media optimized layout with center-focused composition',
    safeZones: 'Maintain 35-40% margins top/bottom, 20-25% margins left/right',
    composition: 'Center-weighted layout with all content in middle third of image',
    negativePrompts: 'No content in top/bottom 35% of image, keep all elements center-focused'
  }
};

/**
 * Get safe space rules for a specific aspect ratio
 */
export function getSafeSpaceRules(aspectRatio: string): SafeSpaceConfig {
  // Normalize aspect ratio string
  const normalizedRatio = aspectRatio?.replace(/[\s:]/g, ':').toLowerCase() || '1:1';
  
  // Try exact match first
  if (SAFE_SPACE_CONFIGS[normalizedRatio]) {
    return SAFE_SPACE_CONFIGS[normalizedRatio];
  }
  
  // Try reverse ratio (e.g., 3:4 becomes 4:3)
  const [width, height] = normalizedRatio.split(':');
  const reversedRatio = `${height}:${width}`;
  if (SAFE_SPACE_CONFIGS[reversedRatio]) {
    return SAFE_SPACE_CONFIGS[reversedRatio];
  }
  
  // Default to 1:1 if no match found
  return SAFE_SPACE_CONFIGS['1:1'];
}

/**
 * Append safe space rules to an image generation prompt
 */
export function appendSafeSpaceRules(originalPrompt: string, aspectRatio: string = '1:1'): string {
  const safeSpaceConfig = getSafeSpaceRules(aspectRatio);
  
  const safeSpaceText = `

--- CRITICAL COMPOSITION REQUIREMENTS ---
${safeSpaceConfig.aspectRatio}:
- Safe Zones: ${safeSpaceConfig.safeZones}
- Composition: ${safeSpaceConfig.composition}
- NEGATIVE CONSTRAINTS: ${safeSpaceConfig.negativePrompts}

These composition rules MUST override any conflicting instructions above. Ensure all elements respect the safe zone boundaries.`;

  return originalPrompt + safeSpaceText;
}

/**
 * Get all available aspect ratios with their safe space configurations
 */
export function getAllSafeSpaceConfigs(): Record<string, SafeSpaceConfig> {
  return { ...SAFE_SPACE_CONFIGS };
}
