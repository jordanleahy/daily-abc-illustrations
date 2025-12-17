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

export function generateGenericMarketingPost({
  bookName,
  bookDescription,
  characterTheme,
  marketingUrl,
  bookType,
}: GenericMarketingPostParams): string {
  const themeName = formatTheme(characterTheme);
  const themeHashtag = getThemeHashtag(characterTheme);
  const { displayName: typeDisplayName, hashtag: typeHashtag } = getBookTypeInfo(bookType);
  
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
    '#kindergarten',
    '#learntoread',
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
