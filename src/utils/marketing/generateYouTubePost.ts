/**
 * Generates YouTube-optimized title, description, and hashtags for book promotion
 * YouTube-specific formatting: shorter title, structured description, fewer hashtags
 */

interface YouTubePostParams {
  bookName: string;
  bookDescription: string | null;
  characterTheme: string | null;
  marketingUrl: string;
  bookType?: string | null;
  season?: string | null;
  environment?: string | null;
  clothingBrand?: string | null;
  location?: string | null;
  targetAge?: string | null;
}

interface YouTubePost {
  title: string;
  description: string;
  hashtags: string;
  fullPost: string; // Combined for easy copying
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
    'dora': 'Dora the Explorer',
    'little-mermaid': 'The Little Mermaid',
  };
  
  return themeMap[theme] || theme;
}

/**
 * Gets book type display info
 */
function getBookTypeInfo(bookType: string | null): { displayName: string; keyword: string } {
  if (!bookType) return { displayName: 'Learning', keyword: 'educational' };
  
  const typeMap: Record<string, { displayName: string; keyword: string }> = {
    'abc': { displayName: 'ABC', keyword: 'alphabet' },
    'numbers': { displayName: 'Numbers', keyword: 'counting' },
    'colors': { displayName: 'Colors', keyword: 'colors' },
    'shapes': { displayName: 'Shapes', keyword: 'shapes' },
    'animals': { displayName: 'Animals', keyword: 'animals' },
    'rhyming': { displayName: 'Rhyming', keyword: 'rhyming' },
    'opposites': { displayName: 'Opposites', keyword: 'opposites' },
    'emotions': { displayName: 'Emotions', keyword: 'emotions' },
    'first-words': { displayName: 'First Words', keyword: 'first words' },
    'bedtime': { displayName: 'Bedtime', keyword: 'bedtime' },
    'cvc': { displayName: 'CVC Words', keyword: 'phonics' },
    'sight-words': { displayName: 'Sight Words', keyword: 'sight words' },
    'digraphs': { displayName: 'Digraphs', keyword: 'phonics' },
  };
  
  return typeMap[bookType] || { displayName: 'Learning', keyword: 'educational' };
}

/**
 * Gets age range display text
 */
function getAgeDisplay(targetAge: string | null): string {
  const ageMap: Record<string, string> = {
    'toddler': 'Toddlers (1-3)',
    'preschool': 'Preschool (3-5)',
    'prek': 'Pre-K (4-5)',
    'kindergarten': 'Kindergarten (5-6)',
    'first-grade': 'First Grade (6-7)',
  };
  return ageMap[targetAge || 'preschool'] || 'Preschool & Kindergarten';
}

/**
 * Generates YouTube-optimized hashtags (3-5 recommended by YouTube)
 */
function generateYouTubeHashtags(
  bookType: string | null,
  characterTheme: string | null,
  environment: string | null,
  location: string | null
): string[] {
  const hashtags: string[] = [];
  
  // Core educational hashtags (always include)
  hashtags.push('#KidsBooks');
  hashtags.push('#EarlyLearning');
  
  // Book type specific
  if (bookType === 'abc') hashtags.push('#ABCForKids');
  else if (bookType === 'numbers') hashtags.push('#CountingForKids');
  else if (bookType === 'sight-words') hashtags.push('#SightWords');
  else if (bookType === 'digraphs') hashtags.push('#Phonics');
  else if (bookType === 'cvc') hashtags.push('#Phonics');
  else hashtags.push('#LearnToRead');
  
  // Theme hashtag
  if (characterTheme && characterTheme !== 'no-theme' && characterTheme !== 'black-and-white') {
    const themeTag = formatTheme(characterTheme).replace(/\s+/g, '');
    hashtags.push(`#${themeTag}`);
  }
  
  // Environment/location hashtag (pick one if available)
  if (location) {
    const locationMap: Record<string, string> = {
      'VAIL_RESORT': '#SkiWithKids',
      'SUGARBUSH_RESORT': '#VermontSki',
      'KILLINGTON': '#Killington',
      'BRECKENRIDGE': '#Breckenridge',
      'PARK_CITY': '#ParkCity',
    };
    if (locationMap[location.toUpperCase()]) {
      hashtags.push(locationMap[location.toUpperCase()]);
    }
  } else if (environment) {
    const envMap: Record<string, string> = {
      'SNOWBOARD_RESORT': '#Snowboarding',
      'SKI_RESORT': '#SkiFamily',
      'BEACH': '#BeachKids',
      'MOUNTAIN': '#OutdoorKids',
    };
    if (envMap[environment.toUpperCase()]) {
      hashtags.push(envMap[environment.toUpperCase()]);
    }
  }
  
  // Limit to 5 hashtags (YouTube recommendation)
  return hashtags.slice(0, 5);
}

/**
 * Generates a YouTube-optimized title (max 100 chars)
 */
function generateTitle(
  bookName: string,
  bookType: string | null,
  characterTheme: string | null
): string {
  const themeName = formatTheme(characterTheme);
  const { displayName: typeName } = getBookTypeInfo(bookType);
  
  // Build title with priority: Book name > Theme > Type
  let title = '';
  
  if (themeName) {
    title = `${bookName} | ${themeName} ${typeName} Book for Kids`;
  } else {
    title = `${bookName} | ${typeName} Book for Kids`;
  }
  
  // Ensure under 100 chars
  if (title.length > 100) {
    title = `${bookName} | Kids ${typeName} Book`;
  }
  if (title.length > 100) {
    title = bookName.substring(0, 97) + '...';
  }
  
  return title;
}

/**
 * Generates a YouTube-optimized description
 */
function generateDescription(
  bookName: string,
  bookDescription: string | null,
  bookType: string | null,
  characterTheme: string | null,
  targetAge: string | null,
  marketingUrl: string
): string {
  const themeName = formatTheme(characterTheme);
  const { displayName: typeName, keyword } = getBookTypeInfo(bookType);
  const ageDisplay = getAgeDisplay(targetAge);
  
  // Opening hook
  let description = `📚 ${bookName}\n\n`;
  
  // Book description or generated one
  if (bookDescription) {
    description += `${bookDescription}\n\n`;
  } else {
    const themePhrase = themeName ? ` featuring ${themeName}` : '';
    description += `A fun ${keyword} adventure${themePhrase} perfect for early learners!\n\n`;
  }
  
  // What's included section
  description += `✨ WHAT'S INSIDE:\n`;
  description += `• Beautiful, colorful illustrations\n`;
  description += `• Free downloadable coloring pages\n`;
  description += `• Perfect for ${ageDisplay}\n`;
  if (typeName !== 'Learning') {
    description += `• Learn ${keyword} through fun stories\n`;
  }
  description += `\n`;
  
  // Call to action
  description += `📖 READ FREE: ${marketingUrl}\n\n`;
  
  // Subscribe CTA
  description += `👆 SUBSCRIBE for more free kids books and educational content!\n\n`;
  
  // About section
  description += `---\n`;
  description += `Daily ABC Illustrations creates free educational books for children. `;
  description += `Our illustrated books help kids learn the alphabet, phonics, sight words, and more through engaging stories and activities.\n`;
  
  return description;
}

export function generateYouTubePost({
  bookName,
  bookDescription,
  characterTheme,
  marketingUrl,
  bookType,
  season,
  environment,
  clothingBrand,
  location,
  targetAge,
}: YouTubePostParams): YouTubePost {
  const title = generateTitle(bookName, bookType, characterTheme);
  
  const description = generateDescription(
    bookName,
    bookDescription,
    bookType,
    characterTheme,
    targetAge,
    marketingUrl
  );
  
  const hashtagsArray = generateYouTubeHashtags(bookType, characterTheme, environment, location);
  const hashtags = hashtagsArray.join(' ');
  
  // Full post combines all for easy single-copy
  const fullPost = `TITLE:\n${title}\n\n---\n\nDESCRIPTION:\n${description}\n---\n\nHASHTAGS:\n${hashtags}`;
  
  return {
    title,
    description,
    hashtags,
    fullPost,
  };
}
