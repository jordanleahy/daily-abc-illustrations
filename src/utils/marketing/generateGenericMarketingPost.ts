/**
 * Generates a generic social media marketing post for any book type
 * Designed for Instagram, Facebook, and LinkedIn
 */

interface GenericMarketingPostParams {
  bookName: string;
  bookDescription: string | null;
  characterTheme: string | null;
  marketingUrl: string;
  bookType?: string | null;
  // Discovery attributes for dynamic hashtags
  season?: string | null;
  environment?: string | null;
  clothingBrand?: string | null;
  location?: string | null;
}

/**
 * Formats character theme for display
 */
function formatTheme(theme: string | null): string {
  if (!theme || theme === 'no-theme') return '';
  
  const themeMap: Record<string, string> = {
    'paw-patrol': 'Paw Patrol',
    'frozen': 'Frozen',
    'peppa-pig': 'Peppa Pig',
    'bluey': 'Bluey',
    'cocomelon': 'Cocomelon',
    'moana': 'Moana',
    'mickey-mouse': 'Mickey Mouse',
    'mario': 'Mario',
    'sesame-street': 'Sesame Street',
    'benji-davies': 'Benji Davies Style',
    'black-and-white': 'Classic',
    'bear-stories': 'Bear Stories',
  };
  
  return themeMap[theme] || theme;
}

/**
 * Gets hashtag for character theme
 */
function getThemeHashtag(theme: string | null): string {
  if (!theme || theme === 'no-theme' || theme === 'black-and-white') return '';
  
  const formatted = formatTheme(theme).replace(/\s+/g, '');
  return `#${formatted}`;
}

/**
 * Gets book type display name and hashtag
 */
function getBookTypeInfo(bookType: string | null): { displayName: string; hashtag: string } {
  if (!bookType) return { displayName: 'learning', hashtag: '#earlylearning' };
  
  const typeMap: Record<string, { displayName: string; hashtag: string }> = {
    'abc': { displayName: 'ABC', hashtag: '#ABCBooks' },
    'numbers': { displayName: 'Numbers', hashtag: '#NumberBooks' },
    'colors': { displayName: 'Colors', hashtag: '#ColorBooks' },
    'shapes': { displayName: 'Shapes', hashtag: '#ShapeBooks' },
    'animals': { displayName: 'Animals', hashtag: '#AnimalBooks' },
    'rhyming': { displayName: 'Rhyming', hashtag: '#RhymingBooks' },
    'opposites': { displayName: 'Opposites', hashtag: '#OppositesBooks' },
    'emotions': { displayName: 'Emotions', hashtag: '#EmotionBooks' },
    'first-words': { displayName: 'First Words', hashtag: '#FirstWords' },
    'bedtime': { displayName: 'Bedtime', hashtag: '#BedtimeStories' },
    'cvc': { displayName: 'CVC Words', hashtag: '#CVCWords' },
    'sight-words': { displayName: 'Sight Words', hashtag: '#SightWords' },
    'digraphs': { displayName: 'Digraphs', hashtag: '#Digraphs' },
  };
  
  return typeMap[bookType] || { displayName: 'learning', hashtag: '#earlylearning' };
}

/**
 * Gets hashtag for season
 */
function getSeasonHashtag(season: string | null): string {
  if (!season) return '';
  
  const seasonMap: Record<string, string> = {
    'SPRING': '#SpringReads',
    'SUMMER': '#SummerReading',
    'FALL': '#FallBooks',
    'WINTER': '#WinterReading',
  };
  
  return seasonMap[season.toUpperCase()] || '';
}

/**
 * Gets hashtags for environment
 */
function getEnvironmentHashtag(env: string | null): string {
  if (!env) return '';
  
  const envMap: Record<string, string> = {
    'SNOWBOARD_RESORT': '#Snowboarding #SnowboardKids',
    'SKI_RESORT': '#Skiing #SkiKids',
    'ISLAND': '#BeachLife #IslandAdventure',
    'DESERT': '#DesertAdventure',
    'MOUNTAIN': '#MountainAdventure',
    'CITY': '#CityKids #UrbanAdventure',
    'PARK': '#OutdoorKids',
  };
  
  return envMap[env.toUpperCase()] || '';
}

/**
 * Gets hashtags for clothing brand
 */
function getClothingBrandHashtag(brand: string | null): string {
  if (!brand || brand === 'NONE' || brand.toUpperCase() === 'NONE') return '';
  
  const brandMap: Record<string, string> = {
    'BURTON': '#Burton #BurtonKids',
  };
  
  return brandMap[brand.toUpperCase()] || '';
}

/**
 * Gets hashtags for location
 */
function getLocationHashtag(loc: string | null): string {
  if (!loc) return '';
  
  const locationMap: Record<string, string> = {
    'VAIL_RESORT': '#Vail #VailResort',
    'SUGARBUSH_RESORT': '#Sugarbush #Vermont',
    'STRATTON': '#Stratton #VermontSki',
    'KILLINGTON': '#Killington #BeastOfTheEast',
    'MOUNTAIN_CREEK': '#MountainCreek #NJSki',
    'COPPER_MOUNTAIN': '#CopperMountain #Colorado',
    'BRECKENRIDGE': '#Breckenridge #Breck',
    'KEYSTONE': '#Keystone #KeystoneResort',
  };
  
  return locationMap[loc.toUpperCase()] || '';
}

export function generateGenericMarketingPost({
  bookName,
  bookDescription,
  characterTheme,
  marketingUrl,
  bookType,
  season,
  environment,
  clothingBrand,
  location,
}: GenericMarketingPostParams): string {
  const themeName = formatTheme(characterTheme);
  const themeHashtag = getThemeHashtag(characterTheme);
  const { displayName: typeDisplayName, hashtag: typeHashtag } = getBookTypeInfo(bookType);
  const seasonHashtag = getSeasonHashtag(season);
  const environmentHashtag = getEnvironmentHashtag(environment);
  const brandHashtag = getClothingBrandHashtag(clothingBrand);
  const locationHashtag = getLocationHashtag(location);
  
  // Build tagline
  let tagline = `🎨 NEW: ${bookName}`;
  if (themeName) {
    tagline += ` featuring ${themeName}!`;
  } else {
    tagline += `!`;
  }
  
  // Build description
  const description = bookDescription || `A fun ${typeDisplayName.toLowerCase()} adventure for early learners!`;
  
  // Build hashtags
  const hashtags = [
    '#phonics',
    typeHashtag,
    '#earlyreading',
    '#preschool',
    seasonHashtag,
    environmentHashtag,
    brandHashtag,
    locationHashtag,
    themeHashtag,
  ].filter(Boolean).join(' ');
  
  // Assemble full post
  const post = `${tagline}

${description}

✅ Colorful illustrations
✅ Downloadable coloring pages
✅ Perfect for early readers

📚 Read free: ${marketingUrl}

${hashtags}`;

  return post;
}
