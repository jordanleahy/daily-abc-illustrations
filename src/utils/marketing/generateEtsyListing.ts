/**
 * Etsy Listing Generator
 * Creates SEO-optimized title, description, and tags for Etsy digital download listings
 */

interface EtsyListingParams {
  bookName: string;
  bookDescription: string | null;
  characterTheme: string | null;
  bookType: string | null;
  targetAge: string | null;
  pageCount?: number;
  city?: string | null;
  resort?: string | null;
}

interface EtsyListing {
  title: string;
  description: string;
  tags: string[];
}

/**
 * Get subject type display name for Etsy title
 * Maps book types to clear subject descriptors
 */
function getSubjectType(bookType: string | null): string {
  if (!bookType) return 'Coloring';
  
  const subjectMap: Record<string, string> = {
    abc: 'ABC Alphabet',
    numbers: 'Numbers Counting',
    rhyming: 'Rhyming',
    opposites: 'Opposites',
    digraphs: 'Phonics',
    colors: 'Colors',
    shapes: 'Shapes',
    bedtime: 'Bedtime',
    feelings: 'Feelings',
  };
  
  return subjectMap[bookType.toLowerCase()] || 'Coloring';
}

/**
 * Get book type display name for Etsy title
 */
function getBookTypeKeyword(bookType: string | null): string {
  if (!bookType) return 'Coloring Book';
  
  const typeMap: Record<string, string> = {
    abc: 'ABC Alphabet Coloring Book',
    numbers: 'Numbers Counting Coloring Book',
    rhyming: 'Rhyming Coloring Book',
    opposites: 'Opposites Coloring Book',
    digraphs: 'Phonics Coloring Book',
    colors: 'Colors Learning Coloring Book',
    shapes: 'Shapes Coloring Book',
    bedtime: 'Bedtime Coloring Book',
    feelings: 'Feelings Coloring Book',
  };
  
  return typeMap[bookType.toLowerCase()] || 'Coloring Book';
}

/**
 * Get age group keyword for Etsy title
 */
function getAgeKeyword(targetAge: string | null): string {
  if (!targetAge) return 'Kids';
  
  const ageMap: Record<string, string> = {
    'infant': 'Baby',
    'toddler': 'Toddler',
    'preschool': 'Preschool',
    'kindergarten': 'Kindergarten',
    'early-elementary': 'Kids',
  };
  
  return ageMap[targetAge] || 'Kids';
}

/**
 * Format city ID to display name
 */
function formatCity(city: string | null): string {
  if (!city) return '';
  
  // Convert JERSEY_CITY to Jersey City, PARK_CITY to Park City, etc.
  return city
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format resort ID to display name
 */
function formatResort(resort: string | null): string {
  if (!resort) return '';
  
  // Convert WESTON to Weston, VAIL to Vail, etc.
  return resort
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format theme for display
 */
function formatTheme(theme: string | null): string {
  if (!theme) return '';
  
  const themeMap: Record<string, string> = {
    bears: 'Bear',
    dinosaurs: 'Dinosaur',
    dogs: 'Dog',
    cats: 'Cat',
    unicorns: 'Unicorn',
    dragons: 'Dragon',
    robots: 'Robot',
    bunnies: 'Bunny',
    owls: 'Owl',
    foxes: 'Fox',
    penguins: 'Penguin',
    elephants: 'Elephant',
    lions: 'Lion',
    monkeys: 'Monkey',
    pandas: 'Panda',
    tigers: 'Tiger',
    koalas: 'Koala',
    giraffes: 'Giraffe',
    zebras: 'Zebra',
    hippos: 'Hippo',
    bluey: 'Bluey',
    weston: 'Weston',
    cocomelon: 'Cocomelon',
    paw_patrol: 'Paw Patrol',
    mickey_mouse: 'Mickey Mouse',
    minnie_mouse: 'Minnie Mouse',
    peppa_pig: 'Peppa Pig',
  };
  
  return themeMap[theme.toLowerCase()] || theme.charAt(0).toUpperCase() + theme.slice(1);
}

/**
 * Generate SEO-optimized Etsy title (max 140 chars)
 * Priority: Subject Type + Location (City/Resort) + Theme + Digital Download
 */
function generateTitle(
  bookName: string,
  bookType: string | null,
  characterTheme: string | null,
  targetAge: string | null,
  pageCount: number,
  city: string | null,
  resort: string | null
): string {
  const subjectType = getSubjectType(bookType);
  const location = formatResort(resort) || formatCity(city);
  const theme = formatTheme(characterTheme);
  const ageKeyword = getAgeKeyword(targetAge);
  
  // Build title with subject type and location front-loaded
  const parts: string[] = [];
  
  // Start with subject type
  parts.push(`${subjectType} Coloring Book`);
  
  // Add location (city or resort)
  if (location) {
    parts.push(location);
  }
  
  // Add theme
  if (theme) {
    parts.push(`${theme} Theme`);
  }
  
  // Add key SEO terms
  parts.push('Digital Download');
  parts.push(`${ageKeyword} Printable`);
  parts.push(`${pageCount} Pages`);
  
  let title = parts.join(' | ');
  
  // Truncate if over 140 chars
  if (title.length > 140) {
    // Try shorter version without page count
    parts.pop();
    title = parts.join(' | ');
  }
  
  if (title.length > 140) {
    title = title.substring(0, 137) + '...';
  }
  
  return title;
}

/**
 * Generate detailed Etsy description
 */
function generateDescription(
  bookName: string,
  bookDescription: string | null,
  bookType: string | null,
  characterTheme: string | null,
  targetAge: string | null,
  pageCount: number
): string {
  const ageGroup = getAgeKeyword(targetAge).toLowerCase();
  const theme = formatTheme(characterTheme);
  const bookTypeDisplay = getBookTypeKeyword(bookType);
  
  let description = `✨ INSTANT DOWNLOAD - ${pageCount} Printable Coloring Pages! ✨\n\n`;
  
  // Add book name
  description += `"${bookName}"\n\n`;
  
  // Add book description if available
  if (bookDescription) {
    const sentences = bookDescription.split(/[.!?]+/).filter(s => s.trim());
    const shortDesc = sentences.slice(0, 2).join('. ').trim();
    if (shortDesc) {
      description += `${shortDesc}.\n\n`;
    }
  }
  
  // What You Get section
  description += `📦 WHAT YOU GET:\n`;
  description += `• ${pageCount} high-quality coloring pages\n`;
  description += `• Print as many times as you like\n`;
  description += `• Perfect for ${ageGroup} children\n`;
  if (theme) {
    description += `• Adorable ${theme.toLowerCase()} characters throughout\n`;
  }
  description += `• AI-illustrated with beautiful detail\n\n`;
  
  // Perfect For section
  description += `🎨 PERFECT FOR:\n`;
  description += `• Quiet time activities\n`;
  description += `• Homeschool learning\n`;
  description += `• Travel entertainment\n`;
  description += `• Rainy day fun\n`;
  description += `• Classroom activities\n`;
  description += `• Birthday party favors\n\n`;
  
  // How It Works section
  description += `📋 HOW IT WORKS:\n`;
  description += `1. Purchase and download instantly\n`;
  description += `2. Print at home on letter-size paper\n`;
  description += `3. Start coloring!\n\n`;
  
  // Educational focus based on book type
  if (bookType) {
    description += `📚 EDUCATIONAL FOCUS:\n`;
    switch (bookType.toLowerCase()) {
      case 'abc':
        description += `This ${bookTypeDisplay.toLowerCase()} helps children learn letter recognition, phonics, and vocabulary through engaging illustrations.\n\n`;
        break;
      case 'numbers':
        description += `This counting book helps children develop numerical literacy and counting skills through fun activities.\n\n`;
        break;
      case 'shapes':
        description += `This shapes book helps children develop spatial awareness and shape recognition.\n\n`;
        break;
      default:
        description += `This educational coloring book makes learning fun and accessible for young learners.\n\n`;
    }
  }
  
  // Disclaimer
  description += `⚠️ This is a DIGITAL DOWNLOAD - no physical product will be shipped.\n\n`;
  description += `💖 Thank you for supporting Daily ABC Illustrations!`;
  
  return description;
}

/**
 * Generate Etsy tags (max 13, each max 20 chars)
 */
function generateTags(
  bookType: string | null,
  characterTheme: string | null,
  targetAge: string | null,
  city: string | null,
  resort: string | null
): string[] {
  const tags: string[] = [];
  const theme = formatTheme(characterTheme);
  const ageKeyword = getAgeKeyword(targetAge);
  const location = formatResort(resort) || formatCity(city);
  
  // Book type specific tags
  if (bookType) {
    switch (bookType.toLowerCase()) {
      case 'abc':
        tags.push('abc coloring book', 'alphabet printable', 'letter learning');
        break;
      case 'numbers':
        tags.push('counting book', 'numbers printable', 'math activities');
        break;
      case 'shapes':
        tags.push('shapes printable', 'shape learning', 'preschool shapes');
        break;
      case 'rhyming':
        tags.push('rhyming book', 'phonics printable', 'rhyme learning');
        break;
      case 'opposites':
        tags.push('opposites book', 'learning opposites', 'opposite words');
        break;
      case 'digraphs':
        tags.push('phonics book', 'reading practice');
        break;
      case 'feelings':
        tags.push('feelings book', 'emotions learning');
        break;
      case 'bedtime':
        tags.push('bedtime book', 'sleep time');
        break;
      default:
        tags.push('kids coloring book');
    }
  }
  
  // Location tag (city or resort)
  if (location && location.length <= 20) {
    tags.push(`${location.toLowerCase()} coloring`.substring(0, 20));
  }
  
  // Theme tag
  if (theme && theme.length <= 20) {
    tags.push(`${theme.toLowerCase()} coloring`.substring(0, 20));
  }
  
  // Age group tags
  tags.push(`${ageKeyword.toLowerCase()} activities`.substring(0, 20));
  tags.push(`${ageKeyword.toLowerCase()} printable`.substring(0, 20));
  
  // General tags
  tags.push('coloring pages');
  tags.push('digital download');
  tags.push('instant download');
  tags.push('printable pages');
  tags.push('kids activity');
  tags.push('homeschool');
  
  // Dedupe and limit to 13
  const uniqueTags = [...new Set(tags)]
    .filter(tag => tag.length <= 20)
    .slice(0, 13);
  
  return uniqueTags;
}

/**
 * Main export: Generate complete Etsy listing
 */
export function generateEtsyListing({
  bookName,
  bookDescription,
  characterTheme,
  bookType,
  targetAge,
  pageCount = 12,
  city,
  resort,
}: EtsyListingParams): EtsyListing {
  const title = generateTitle(bookName, bookType, characterTheme, targetAge, pageCount, city || null, resort || null);
  const description = generateDescription(bookName, bookDescription, bookType, characterTheme, targetAge, pageCount);
  const tags = generateTags(bookType, characterTheme, targetAge, city || null, resort || null);
  
  return {
    title,
    description,
    tags,
  };
}
