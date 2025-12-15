/**
 * Generates a social media marketing post for digraph books
 * Designed for Instagram, Facebook, and LinkedIn
 */

interface DigraphMarketingPostParams {
  bookName: string;
  bookDescription: string | null;
  characterTheme: string | null;
  marketingUrl: string;
  pageTitles: string[]; // Content page titles (pages 3+)
}

/**
 * Extracts the digraph from page titles (format: "digraph - sentence")
 */
function extractDigraph(pageTitles: string[]): string | null {
  if (pageTitles.length === 0) return null;
  
  const firstTitle = pageTitles[0];
  const match = firstTitle.match(/^(\w{2,3})\s*-/);
  return match ? match[1].toLowerCase() : null;
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

export function generateDigraphMarketingPost({
  bookName,
  bookDescription,
  characterTheme,
  marketingUrl,
  pageTitles,
}: DigraphMarketingPostParams): string {
  const digraph = extractDigraph(pageTitles);
  const themeName = formatTheme(characterTheme);
  const themeHashtag = getThemeHashtag(characterTheme);
  
  // Build tagline
  let tagline = `🎨 NEW: Learn the "${digraph}" sound`;
  if (themeName) {
    tagline += ` with ${themeName}!`;
  } else {
    tagline += `!`;
  }
  
  // Build description
  const description = bookDescription || `Discover words with the "${digraph}" sound in this fun phonics adventure!`;
  
  // Build page list
  const pageList = pageTitles
    .map(title => `• ${title}`)
    .join('\n');
  
  // Build hashtags
  const hashtags = [
    '#phonics',
    '#digraphs', 
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

📖 What's inside:
${pageList}

📚 Read free: ${marketingUrl}

${hashtags}`;

  return post;
}
