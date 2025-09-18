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
    description: 'Centered layout with balanced margins on all sides',
    safeZones: 'Maintain MINIMUM 22-25% margins on all sides, especially TOP MARGIN for letter-based content, ensure NO illustrations extend beyond inner 50% of frame',
    composition: 'Strictly centered layout with generous breathing room from all edges, all visual elements contained well within safe boundaries',
    negativePrompts: 'STRICTLY PROHIBIT any corner-to-corner compositions, NEVER allow illustrations to bleed to edges, no edge-hugging elements, NEVER allow letters or illustrations to touch or get close to any edge, maintain large buffer zones around all elements'
  },
  '16:9': {
    aspectRatio: '16:9 Landscape Format',
    description: 'Wide horizontal layout with proper safe boundaries',
    safeZones: 'Maintain MINIMUM 20-25% margins on left and right sides, MINIMUM 15-20% margins on top and bottom, ensure NO illustration bleeding',
    composition: 'Strictly contained wide horizontal layout with all visual elements well within safe boundaries, never extending to edges',
    negativePrompts: 'STRICTLY PROHIBIT edge bleeding, no illustrations touching left/right/top/bottom edges, no edge-to-edge content, maintain large buffer zones around all visual elements'
  },
  '9:16': {
    aspectRatio: '9:16 Portrait Format',
    description: 'Vertical orientation with generous breathing room',
    safeZones: 'Maintain MINIMUM 18-22% margins on top and bottom, MINIMUM 12-15% margins on left and right sides, prevent any edge bleeding',
    composition: 'Strictly contained vertical orientation with generous breathing room from all edges',
    negativePrompts: 'STRICTLY PROHIBIT elements touching any edges, maintain large vertical and horizontal buffer zones, no edge bleeding, no cramped layouts'
  },
  '4:3': {
    aspectRatio: '4:3 Standard Format',
    description: 'Balanced horizontal spacing with proper frame margins',
    safeZones: 'Maintain MINIMUM 18-20% margins on left and right, MINIMUM 15-18% margins on top and bottom, ensure complete edge safety',
    composition: 'Strictly balanced horizontal spacing with large frame margins, all elements contained within center area',
    negativePrompts: 'STRICTLY PROHIBIT any elements touching frame borders, no edge bleeding, maintain large horizontal and vertical buffer zones around all visual elements'
  },
  '3:4': {
    aspectRatio: '3:4 Portrait Format',
    description: 'Optimized for social media viewing with proper vertical spacing',
    safeZones: 'Maintain MINIMUM 15-20% margins on top and bottom, MINIMUM 12-15% margins on left and right sides, prevent platform overlay conflicts',
    composition: 'Strictly contained social media layout with proper vertical spacing, all elements within safe center area',
    negativePrompts: 'STRICTLY PROHIBIT elements touching any edges, maintain social media safe zones with large buffer areas, no edge bleeding, no cramped content'
  },
  '4:5': {
    aspectRatio: '4:5 Portrait Format',
    description: 'Moderately tall portrait layout ideal for print and digital display',
    safeZones: 'Maintain MINIMUM 18-22% margins on top and bottom, MINIMUM 15% margins on left and right sides, ensure print-safe boundaries',
    composition: 'Strictly contained moderately tall portrait with well-balanced vertical composition, all elements within safe boundaries',
    negativePrompts: 'STRICTLY PROHIBIT elements touching any edges, maintain large balanced buffer zones, no edge bleeding, no cramped portrait layouts'
  },
  '1200:630': {
    aspectRatio: '1200x630 Social Media Format',
    description: 'Optimized for social media sharing with platform-safe composition',
    safeZones: 'Maintain MINIMUM 20-25% margins on left and right sides, MINIMUM 25-30% margins on top and bottom to prevent any illustration bleeding and ensure complete safety from platform UI overlays',
    composition: 'Strictly centered layout with all illustrations, text, and visual elements contained well within the safe boundaries, never extending beyond the inner 50% of the frame',
    negativePrompts: 'STRICTLY PROHIBIT any illustration elements from touching or getting close to edges, NEVER allow edge bleeding, no illustrations extending to outer margins, no edge-to-edge content, no corner positioning, maintain extra-large buffer zones around all visual elements'
  },
  '40:21': {
    aspectRatio: '40:21 Social Media Format (1200x630)',
    description: 'Optimized for social media sharing with platform-safe composition',
    safeZones: 'Maintain MINIMUM 20-25% margins on left and right sides, MINIMUM 25-30% margins on top and bottom to prevent any illustration bleeding and ensure complete safety from platform UI overlays',
    composition: 'Strictly centered layout with all illustrations, text, and visual elements contained well within the safe boundaries, never extending beyond the inner 50% of the frame',
    negativePrompts: 'STRICTLY PROHIBIT any illustration elements from touching or getting close to edges, NEVER allow edge bleeding, no illustrations extending to outer margins, no edge-to-edge content, no corner positioning, maintain extra-large buffer zones around all visual elements'
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