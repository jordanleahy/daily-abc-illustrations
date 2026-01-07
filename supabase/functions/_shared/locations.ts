// Location constants for book creation flow
// Locations are asked as an optional discovery question at the end

export const VALID_LOCATIONS = [
  'VAIL_RESORT',
  'SUGARBUSH_RESORT',
  'STRATTON',
  'KILLINGTON',
  'MOUNTAIN_CREEK',
  'COPPER_MOUNTAIN',
  'BRECKENRIDGE',
  'KEYSTONE',
  'WHISTLER_BLACKCOMB',
  'NONE' // Represents "skipped" - no specific location
] as const;

export type ValidLocation = typeof VALID_LOCATIONS[number];

export interface LocationOption {
  id: ValidLocation;
  label: string;
  emoji: string;
  description: string;
}

// Static location options
export const LOCATION_OPTIONS: LocationOption[] = [
  { id: 'VAIL_RESORT', label: 'Vail Resort', emoji: '🏔️', description: 'Colorado, world-class terrain' },
  { id: 'SUGARBUSH_RESORT', label: 'Sugarbush Resort', emoji: '🍁', description: 'Vermont, classic New England' },
  { id: 'STRATTON', label: 'Stratton', emoji: '⛷️', description: 'Vermont, family-friendly' },
  { id: 'KILLINGTON', label: 'Killington Mountain', emoji: '🏂', description: 'Vermont, the Beast of the East' },
  { id: 'MOUNTAIN_CREEK', label: 'Mountain Creek', emoji: '🎿', description: 'New Jersey, accessible fun' },
  { id: 'COPPER_MOUNTAIN', label: 'Copper Mountain', emoji: '🥉', description: 'Colorado, naturally divided terrain' },
  { id: 'BRECKENRIDGE', label: 'Breckenridge', emoji: '🏘️', description: 'Colorado, historic mountain town' },
  { id: 'KEYSTONE', label: 'Keystone', emoji: '🌙', description: 'Colorado, night skiing' },
  { id: 'WHISTLER_BLACKCOMB', label: 'Whistler Blackcomb', emoji: '🇨🇦', description: 'British Columbia, largest ski resort in North America' },
];

/**
 * Type guard for valid location IDs
 */
export function isValidLocation(value: string): value is ValidLocation {
  return VALID_LOCATIONS.includes(value as ValidLocation);
}

/**
 * Get location label for display
 */
export function getLocationLabel(locId: ValidLocation): string {
  const option = LOCATION_OPTIONS.find(l => l.id === locId);
  return option?.label || locId;
}

/**
 * Get location with emoji for display
 */
export function getLocationDisplay(locId: ValidLocation): string {
  const option = LOCATION_OPTIONS.find(l => l.id === locId);
  return option ? `${option.emoji} ${option.label}` : locId;
}

/**
 * Spelling guidance for commonly misspelled location names
 */
const LOCATION_SPELLING_GUIDE: Partial<Record<ValidLocation, string>> = {
  'KILLINGTON': 'SPELLING: K-I-L-L-I-N-G-T-O-N (note the G before T-O-N)',
  'BRECKENRIDGE': 'SPELLING: B-R-E-C-K-E-N-R-I-D-G-E',
  'KEYSTONE': 'SPELLING: K-E-Y-S-T-O-N-E',
  'WHISTLER_BLACKCOMB': 'SPELLING: W-H-I-S-T-L-E-R B-L-A-C-K-C-O-M-B (two words, Whistler Blackcomb)',
};

/**
 * Visual characteristics and landmarks for each resort
 * Used to ensure AI-generated images authentically represent each location
 */
export interface ResortVisualProfile {
  terrain: string;
  architecture: string;
  landmarks: string[];
  colorPalette: string;
  atmosphere: string;
}

const RESORT_VISUAL_PROFILES: Partial<Record<ValidLocation, ResortVisualProfile>> = {
  'KILLINGTON': {
    terrain: 'Rugged Green Mountain terrain with exposed granite outcrops, dense hardwood/evergreen forests, moderate elevation peaks with natural bowl shapes',
    architecture: 'Rustic Vermont-style lodges with brown/green wood siding, stone foundations, practical New England design',
    landmarks: ['K-1 Gondola (red cabins)', 'Peak Lodge at summit', 'Snowshed base area', 'Superstar trail', 'Bear Mountain'],
    colorPalette: 'Earthy greens, granite grays, autumn oranges/reds, deep forest greens',
    atmosphere: 'Rugged, athletic, East Coast grit, unpretentious skiing culture'
  },
  'VAIL_RESORT': {
    terrain: 'Massive back bowls, wide-open alpine terrain above treeline, dramatic Rocky Mountain peaks with consistent snowpack',
    architecture: 'Bavarian-inspired alpine village with timber and stucco, clock towers, cobblestone walkways, upscale European aesthetic',
    landmarks: ['Vail Village clock tower', 'Eagle Bahn Gondola', 'Blue Sky Basin', 'Two Elk Lodge', 'Golden Peak'],
    colorPalette: 'Bright whites, deep blues, warm timber browns, gold accents',
    atmosphere: 'Luxurious, world-class, European elegance meets Colorado grandeur'
  },
  'SUGARBUSH_RESORT': {
    terrain: 'Classic Vermont Green Mountain terrain, forested glades, varied natural terrain with Lincoln Peak and Mount Ellen',
    architecture: 'Traditional New England ski lodge style, weathered wood, cozy base lodges, authentic Vermont character',
    landmarks: ['Lincoln Peak', 'Mount Ellen', 'Slide Brook Express', 'Castlerock area', 'Valley House'],
    colorPalette: 'Forest greens, maple reds, warm woods, sugar maple oranges',
    atmosphere: 'Classic New England, family-oriented, authentic Vermont skiing heritage'
  },
  'STRATTON': {
    terrain: 'Southern Vermont mountain with groomed intermediate terrain, forested slopes, family-friendly layout',
    architecture: 'Modern alpine village base, clock tower, upscale Vermont aesthetic, well-maintained facilities',
    landmarks: ['Stratton Village', 'Gondola base', 'Sun Bowl', 'World Cup trail', 'Clock tower'],
    colorPalette: 'Clean whites, Vermont greens, classic red accents, timber browns',
    atmosphere: 'Polished, family-friendly, Southern Vermont refinement'
  },
  'MOUNTAIN_CREEK': {
    terrain: 'Smaller New Jersey hills, accessible terrain parks, man-made snow focus, close-to-NYC convenience',
    architecture: 'Modern resort facilities, practical lodge design, terrain park-focused infrastructure',
    landmarks: ['Vernon Peak', 'South Peak', 'Granite Peak', 'Waterpark (summer)', 'Terrain parks'],
    colorPalette: 'Bright action sports colors, grays, modern blues and greens',
    atmosphere: 'Accessible, action-sports focused, suburban mountain escape, youthful energy'
  },
  'COPPER_MOUNTAIN': {
    terrain: 'Naturally divided terrain (beginner/intermediate/expert separated), Rocky Mountain alpine, above-treeline bowls',
    architecture: 'Modern Colorado resort village, stone and timber, practical mountain design',
    landmarks: ['Center Village', 'East Village', 'Copper Peak', 'Tucker Mountain', 'Woodward Barn'],
    colorPalette: 'Copper/bronze tones, Colorado blue skies, pine greens, snow whites',
    atmosphere: 'Laid-back Colorado vibe, terrain park culture, naturally organized mountain'
  },
  'BRECKENRIDGE': {
    terrain: 'High-altitude Rocky Mountain terrain, above-treeline alpine bowls, historic mining-town backdrop, five peaks',
    architecture: 'Historic Victorian mining town Main Street, colorful painted buildings, preserved 1800s character with modern resort amenities',
    landmarks: ['Peak 8', 'Peak 9', 'Main Street historic district', 'Imperial Express (highest chairlift)', 'BreckConnect Gondola'],
    colorPalette: 'Victorian painted colors (blues, reds, yellows), historic wood tones, bright Colorado sunshine',
    atmosphere: 'Historic charm, high-altitude adventure, vibrant town culture, Colorado heritage'
  },
  'KEYSTONE': {
    terrain: 'Three mountains (Dercum, North Peak, The Outback), night skiing terrain, varied difficulty, family-oriented layout',
    architecture: 'Mountain village resort style, modern Colorado lodges, lakeside setting',
    landmarks: ['River Run Village', 'Mountain House base', 'A51 Terrain Park', 'Keystone Lake', 'Outback bowls'],
    colorPalette: 'Evening purples/blues (night skiing), warm lodge lighting, Colorado pine greens, starlit skies',
    atmosphere: 'Family-friendly, famous night skiing, relaxed Colorado mountain village'
  },
  'WHISTLER_BLACKCOMB': {
    terrain: 'Massive dual-mountain resort with dramatic coastal mountain peaks, alpine glaciers, steep chutes, legendary bowls, and extensive above-treeline terrain spanning 8,171 acres',
    architecture: 'European-inspired pedestrian village with stone and timber construction, Pacific Northwest influences, modern luxury resort amenities, mountain chalets',
    landmarks: ['Peak 2 Peak Gondola (record-breaking)', 'Whistler Village stroll', 'Blackcomb Glacier', 'Harmony Bowl', 'Horstman Glacier', '7th Heaven Express', 'Roundhouse Lodge'],
    colorPalette: 'Pacific coastal blues, glacial whites, deep evergreen forests, dramatic cloud-shrouded peaks, Canadian red maple accents',
    atmosphere: 'World-class luxury, Olympic heritage (2010 Winter Games), vibrant après-ski culture, cosmopolitan international vibe, raw coastal mountain grandeur'
  },
};

/**
 * Get spelling guidance for a location if available
 */
export function getLocationSpellingGuide(locId: ValidLocation): string | null {
  return LOCATION_SPELLING_GUIDE[locId] || null;
}

/**
 * Get visual profile for a resort to inject into image generation prompts
 */
export function getResortVisualProfile(locId: ValidLocation): ResortVisualProfile | null {
  return RESORT_VISUAL_PROFILES[locId] || null;
}

/**
 * Format resort visual profile as prompt injection text
 */
export function getResortVisualPrompt(locId: ValidLocation): string | null {
  const profile = RESORT_VISUAL_PROFILES[locId];
  if (!profile) return null;
  
  return `
🏔️ RESORT VISUAL REQUIREMENTS FOR ${getLocationLabel(locId).toUpperCase()}:
• TERRAIN: ${profile.terrain}
• ARCHITECTURE: ${profile.architecture}
• KEY LANDMARKS (include when possible): ${profile.landmarks.join(', ')}
• COLOR PALETTE: ${profile.colorPalette}
• ATMOSPHERE/MOOD: ${profile.atmosphere}

⚠️ DO NOT use generic alpine/Swiss imagery. This resort has DISTINCT visual identity.`;
}
