// City constants for book creation flow
// Cities are asked as an optional discovery question after resort location

export const VALID_CITIES = [
  'JERSEY_CITY',
  'HOBOKEN',
  'NEW_YORK_CITY',
  'NONE' // Represents "skipped" - no specific city
] as const;

export type ValidCity = typeof VALID_CITIES[number];

export interface CityOption {
  id: ValidCity;
  label: string;
  emoji: string;
  description: string;
}

// Static city options
export const CITY_OPTIONS: CityOption[] = [
  { id: 'JERSEY_CITY', label: 'Jersey City', emoji: '🌅', description: 'NJ, waterfront views, diverse neighborhoods' },
  { id: 'HOBOKEN', label: 'Hoboken', emoji: '🚂', description: 'NJ, historic mile-square city' },
  { id: 'NEW_YORK_CITY', label: 'New York City', emoji: '🗽', description: 'The Big Apple, iconic landmarks' },
];

/**
 * Type guard for valid city IDs
 */
export function isValidCity(value: string): value is ValidCity {
  return VALID_CITIES.includes(value as ValidCity);
}

/**
 * Get city label for display
 */
export function getCityLabel(cityId: ValidCity): string {
  const option = CITY_OPTIONS.find(c => c.id === cityId);
  return option?.label || cityId;
}

/**
 * Get city with emoji for display
 */
export function getCityDisplay(cityId: ValidCity): string {
  const option = CITY_OPTIONS.find(c => c.id === cityId);
  return option ? `${option.emoji} ${option.label}` : cityId;
}

/**
 * Visual characteristics and landmarks for each city
 * Used to ensure AI-generated images authentically represent each location
 */
export interface CityVisualProfile {
  terrain: string;
  architecture: string;
  landmarks: string[];
  colorPalette: string;
  atmosphere: string;
}

const CITY_VISUAL_PROFILES: Partial<Record<ValidCity, CityVisualProfile>> = {
  'JERSEY_CITY': {
    terrain: 'Waterfront urban grid along Hudson River, elevated Heights neighborhood, varied density from downtown skyscrapers to residential brownstone blocks, parks integrated throughout',
    architecture: 'Historic brownstones with stoops, modern glass waterfront towers, converted warehouse lofts, Art Deco civic buildings, diverse housing styles mixing old and new',
    landmarks: [
      'Liberty State Park (green lawns, Liberty Science Center, Statue of Liberty views, ferry terminal, Central Railroad of NJ terminal)',
      'Downtown/Exchange Place (Goldman Sachs tower, Colgate Clock, waterfront esplanade, PATH station plaza)',
      'Journal Square (Loew\'s Theatre historic marquee, transportation hub, India Square, diverse restaurants and shops)',
      'Lincoln Park (duck pond, playground, running paths, historic Victorian homes surrounding, Hamilton Park neighborhood)',
      'The Heights (elevated views, Riverview-Fisk Park, Congress Street overlook with panoramic NYC views, Pershing Field)',
      'Hamilton Park (Victorian-era park, central fountain, brownstone-lined streets)',
      'Newport (modern shopping center, waterfront boardwalk, marina)',
      'Van Vorst Park (historic neighborhood, farmers market, tree-lined streets)',
      'LSP Light Rail (distinctive blue train connecting waterfront)',
      'Paulus Hook (cobblestone streets, historic pier, ferry landing)'
    ],
    colorPalette: 'Hudson River blues, brick and terracotta reds, green park spaces, concrete urban grays, golden sunset reflections off Manhattan skyline, brownstone earth tones',
    atmosphere: 'Diverse multicultural community, family-friendly waterfront parks, Manhattan skyline as constant backdrop, urban-meets-nature feel, accessible public transit culture, neighborhood pride, artistic and creative energy'
  },
  'HOBOKEN': {
    terrain: 'Mile-square city on Hudson waterfront, compact urban grid, waterfront parks and piers, elevated western edge',
    architecture: 'Classic brownstones with stoops, narrow tree-lined streets, historic train terminal, waterfront high-rises, preserved 19th century character',
    landmarks: [
      'Washington Street (main commercial strip, restaurants, boutiques)',
      'Stevens Institute of Technology (hilltop campus, castle-like buildings)',
      'Hoboken Terminal (historic Lackawanna train station, copper roof)',
      'Pier A (waterfront park, Manhattan views, playground)',
      'Carlo\'s Bakery (Cake Boss location)',
      'Sinatra Park (named for Frank Sinatra, born here)',
      'Elysian Park (oldest park, baseball birthplace claim)',
      'Church Square Park (historic fountain, neighborhood gathering)'
    ],
    colorPalette: 'Brownstone reds and tans, Hudson River blues, green park spaces, vintage brick textures, copper and brass accents from historic buildings',
    atmosphere: 'Walkable urban village, young professional energy, historic charm, strong Italian-American heritage, vibrant nightlife, community-oriented, NYC commuter culture'
  },
  'NEW_YORK_CITY': {
    terrain: 'Five boroughs spanning islands and mainland, dramatic vertical skyline, grid street system in Manhattan, varied topography across boroughs',
    architecture: 'Iconic skyscrapers (Empire State, Chrysler, One WTC), brownstone neighborhoods, Art Deco masterpieces, modern glass towers, historic bridges, diverse architectural eras',
    landmarks: [
      'Central Park (Great Lawn, Bethesda Fountain, Central Park Zoo)',
      'Times Square (bright lights, Broadway theaters, crowds)',
      'Brooklyn Bridge (iconic suspension bridge, pedestrian walkway)',
      'Empire State Building (Art Deco spire, observation deck)',
      'Statue of Liberty (Lady Liberty, Ellis Island)',
      'Grand Central Terminal (Beaux-Arts ceiling, main concourse)',
      'High Line (elevated park, Chelsea views)',
      'One World Trade Center (Freedom Tower, memorial pools)',
      'Rockefeller Center (skating rink, Christmas tree)',
      'Fifth Avenue (shopping, landmarks)'
    ],
    colorPalette: 'Yellow taxi cab, iconic red and white signage, gray concrete and steel, green park spaces, bright neon lights, limestone and granite building facades',
    atmosphere: 'Bustling energy, iconic and larger-than-life, cultural melting pot, ambitious and fast-paced, 24/7 city that never sleeps, world stage presence'
  },
};

/**
 * Get visual profile for a city to inject into image generation prompts
 */
export function getCityVisualProfile(cityId: ValidCity): CityVisualProfile | null {
  return CITY_VISUAL_PROFILES[cityId] || null;
}

/**
 * Format city visual profile as prompt injection text
 */
export function getCityVisualPrompt(cityId: ValidCity): string | null {
  const profile = CITY_VISUAL_PROFILES[cityId];
  if (!profile) return null;
  
  return `
🏙️ CITY VISUAL REQUIREMENTS FOR ${getCityLabel(cityId).toUpperCase()}:
• TERRAIN/LAYOUT: ${profile.terrain}
• ARCHITECTURE: ${profile.architecture}
• KEY LANDMARKS (include when possible): ${profile.landmarks.join('; ')}
• COLOR PALETTE: ${profile.colorPalette}
• ATMOSPHERE/MOOD: ${profile.atmosphere}

⚠️ DO NOT use generic city imagery. This city has DISTINCT visual identity and neighborhoods.`;
}
