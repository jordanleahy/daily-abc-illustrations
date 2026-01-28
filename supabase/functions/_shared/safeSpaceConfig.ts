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

/**
 * Split-screen composition rules specifically for Opposites books
 * Ensures left/right panels fill 100% height of the image
 */
export const OPPOSITES_SPLIT_SCREEN_RULES = `
--- CRITICAL SPLIT-SCREEN COMPOSITION FOR OPPOSITES ---

**MANDATORY FULL-HEIGHT PANELS:**
1. The image MUST be divided into exactly TWO vertical panels (left and right)
2. EACH panel MUST fill 100% of the image HEIGHT - no gaps at top or bottom
3. The left and right scenes MUST extend from the very TOP edge to the very BOTTOM edge
4. NO horizontal whitespace or padding between the panels and the image boundaries
5. The dividing line between panels should be a clean vertical split at the center

**PANEL COMPOSITION:**
- LEFT PANEL: Shows the first opposite concept, fills entire left half from top to bottom
- RIGHT PANEL: Shows the contrasting opposite concept, fills entire right half from top to bottom
- Both panels share a continuous background that flows edge-to-edge
- Characters and elements are positioned within each panel but the SCENE fills the full height

**NEGATIVE CONSTRAINTS:**
- NEVER leave empty space above or below the scene content
- NEVER create "floating" panels with margins around them
- NEVER add decorative borders that shrink the scene area
- The sky/background MUST extend to the top edge
- The ground/floor MUST extend to the bottom edge

These split-screen rules are MANDATORY and override any conflicting composition instructions.
`;

const SAFE_SPACE_CONFIGS: Record<string, SafeSpaceConfig> = {
  '1:1': {
    aspectRatio: '1:1 Square Format',
    description: 'Centered layout with balanced margins on all sides and protected bottom zone for text overlay',
    safeZones: 'Maintain balanced 18-20% margins on all sides, especially TOP MARGIN for letter-based content. CRITICAL: Keep bottom 8-10% (minimum 40px) completely clear for text overlay',
    composition: 'CENTER-FOCUSED: Main subject positioned at exact center point, centered layout with generous breathing room from top edge, well-framed central focus, equal spacing on all sides. All important visual elements must stay in the top 90% of the image to preserve space for bottom text overlay',
    negativePrompts: 'No corner-to-corner compositions, no off-center focal points, maintain balanced spacing, no edge-hugging elements, NEVER allow letters to touch or get close to the top edge, no cramped letter positioning, no asymmetric subject placement, CRITICAL: no important content in bottom 10% of image, keep bottom safe zone clear for text overlay'
  },
  '16:9': {
    aspectRatio: '16:9 Landscape Format',
    description: 'Wide horizontal layout with proper safe boundaries',
    safeZones: 'Maintain 15-20% margins on left and right sides, 10% margins on top and bottom',
    composition: 'CENTER-FOCUSED: Main subject at horizontal center, wide horizontal layout with workflow elements well within safe boundaries',
    negativePrompts: 'No cramped horizontal layouts, no off-center focal points, no elements touching left/right edges, no edge-to-edge content'
  },
  '9:16': {
    aspectRatio: '9:16 Portrait Format',
    description: 'Vertical orientation with generous breathing room',
    safeZones: 'Maintain 12-15% margins on top and bottom, 8-10% margins on left and right sides',
    composition: 'CENTER-FOCUSED: Main subject at vertical center, vertical orientation with generous breathing room',
    negativePrompts: 'No elements touching top/bottom edges, no off-center focal points, maintain vertical breathing room, no cramped vertical layouts'
  },
  '4:3': {
    aspectRatio: '4:3 Standard Format',
    description: 'Balanced horizontal spacing with proper frame margins',
    safeZones: 'Maintain 12% margins on left and right, 10% margins on top and bottom',
    composition: 'CENTER-FOCUSED: Main subject at center point, balanced horizontal spacing with proper frame margins',
    negativePrompts: 'No cramped compositions, no off-center focal points, no elements touching frame borders, maintain horizontal balance'
  },
  '3:4': {
    aspectRatio: '3:4 Portrait Format',
    description: 'Optimized for social media viewing with proper vertical spacing',
    safeZones: 'Maintain 10-12% margins on top and bottom, 8% margins on left and right sides',
    composition: 'CENTER-FOCUSED: Main subject at center, optimized for social media viewing with proper vertical spacing',
    negativePrompts: 'No elements touching edges, no off-center focal points, maintain social media safe zones, no cramped vertical content'
  },
  '4:5': {
    aspectRatio: '4:5 Portrait Format',
    description: 'Moderately tall portrait layout ideal for print and digital display',
    safeZones: 'Maintain 12-15% margins on top and bottom, 10% margins on left and right sides',
    composition: 'CENTER-FOCUSED: Main subject at center, moderately tall portrait with well-balanced vertical composition',
    negativePrompts: 'No elements touching top/bottom edges, no off-center focal points, maintain balanced vertical spacing, no cramped portrait layouts'
  },
  '3:2': {
    aspectRatio: '3:2 Social Media Format',
    description: 'Social media optimized layout with center-focused composition',
    safeZones: 'Maintain 35-40% margins top/bottom, 20-25% margins left/right',
    composition: 'CENTER-FOCUSED: Main subject at exact center, center-weighted layout with all content in middle third of image',
    negativePrompts: 'No content in top/bottom 35% of image, no off-center focal points, keep all elements center-focused'
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

/**
 * Append split-screen composition rules for Opposites book prompts
 * This ensures left/right panels fill 100% height
 */
export function appendOppositesSplitScreenRules(originalPrompt: string): string {
  return originalPrompt + OPPOSITES_SPLIT_SCREEN_RULES;
}
