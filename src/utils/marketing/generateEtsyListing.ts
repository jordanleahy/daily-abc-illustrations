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
  // Additional discovery attributes
  season?: string | null;
  location?: string | null;
  environment?: string | null;
  clothingBrand?: string | null;
  gradeLevel?: string | null;
  mannerType?: string | null;
  mannersSetting?: string | null;
  numberRange?: string | null;
  letterCase?: string | null;
}

interface EtsyListing {
  title: string;
  description: string;
  tags: string[];
  fileName: string;
}

/**
 * Generate Etsy-compliant file name (3-70 chars, no spaces, alphanumeric + hyphens/underscores/periods only)
 */
function generateEtsyFileName(bookName: string): string {
  // Start with book name, convert to valid characters
  let fileName = bookName
    .replace(/['']/g, '')           // Remove apostrophes
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
  
  // Add suffix for clarity
  const suffix = '-ColoringBook';
  
  // Ensure total length is 3-70 (accounting for .pdf extension = 4 chars)
  // Max base name = 70 - 4 = 66 chars
  const maxBaseLength = 66 - suffix.length; // 53 chars for name
  
  if (fileName.length > maxBaseLength) {
    fileName = fileName.substring(0, maxBaseLength);
    fileName = fileName.replace(/-$/, ''); // Clean trailing hyphen after truncation
  }
  
  fileName = `${fileName}${suffix}`;
  
  // Ensure minimum 3 chars (before .pdf)
  if (fileName.length < 3) {
    fileName = 'ColoringBook';
  }
  
  return fileName;
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
    manners: 'Manners',
    'sight-words': 'Sight Words',
    'first-words': 'First Words',
    animals: 'Animals',
    cvc: 'CVC Words',
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
    manners: 'Manners Coloring Book',
    'sight-words': 'Sight Words Coloring Book',
    'first-words': 'First Words Coloring Book',
    animals: 'Animals Coloring Book',
    cvc: 'CVC Words Coloring Book',
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
 * Format grade level for tags
 */
function formatGradeLevel(gradeLevel: string | null): string {
  if (!gradeLevel) return '';
  
  const gradeMap: Record<string, string> = {
    'pre-k': 'Pre-K',
    'kindergarten': 'Kindergarten',
    '1st': '1st Grade',
    '2nd': '2nd Grade',
    '3rd': '3rd Grade',
  };
  
  return gradeMap[gradeLevel.toLowerCase()] || gradeLevel;
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
 * Format season for display
 */
function formatSeason(season: string | null): string {
  if (!season) return '';
  
  const seasonMap: Record<string, string> = {
    'WINTER': 'Winter',
    'SPRING': 'Spring',
    'SUMMER': 'Summer',
    'FALL': 'Fall',
    'AUTUMN': 'Autumn',
  };
  
  return seasonMap[season.toUpperCase()] || season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
}

/**
 * Format environment for tags
 */
function formatEnvironment(environment: string | null): string {
  if (!environment) return '';
  
  const envMap: Record<string, string> = {
    'SNOWBOARD_RESORT': 'Snowboard',
    'SKI_RESORT': 'Ski Resort',
    'BEACH': 'Beach',
    'FOREST': 'Forest',
    'CITY': 'City',
    'FARM': 'Farm',
    'JUNGLE': 'Jungle',
    'OCEAN': 'Ocean',
    'MOUNTAIN': 'Mountain',
  };
  
  return envMap[environment.toUpperCase()] || environment.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Format clothing brand for tags
 */
function formatClothingBrand(brand: string | null): string {
  if (!brand) return '';
  
  const brandMap: Record<string, string> = {
    'BURTON': 'Burton',
    'PATAGONIA': 'Patagonia',
    'NORTH_FACE': 'North Face',
    'COLUMBIA': 'Columbia',
  };
  
  return brandMap[brand.toUpperCase()] || brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
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
 * Format: Book Type | Grade Level | 2 Books Offering | Location/Season (if available)
 */
function generateTitle(
  bookName: string,
  bookType: string | null,
  characterTheme: string | null,
  targetAge: string | null,
  pageCount: number,
  city: string | null,
  resort: string | null,
  season: string | null,
  gradeLevel: string | null,
  clothingBrand: string | null
): string {
  const parts: string[] = [];
  
  // 1. Book type (e.g., "ABC Alphabet", "Manners", "Rhyming")
  const subjectType = getSubjectType(bookType);
  parts.push(subjectType);
  
  // 2. Grade level if available, otherwise age group
  const grade = formatGradeLevel(gradeLevel);
  if (grade) {
    parts.push(grade);
  } else {
    const age = getAgeKeyword(targetAge);
    if (age && age !== 'Kids') {
      parts.push(age);
    }
  }
  
  // 3. Two books offering - core value proposition
  parts.push('2 Books: Color + Coloring');
  
  // 4. Resort if available (takes priority over city)
  const resortName = formatResort(resort);
  if (resortName) {
    parts.push(resortName);
  }
  
  // 5. City if available (and no resort)
  if (!resortName) {
    const cityName = formatCity(city);
    if (cityName) {
      parts.push(cityName);
    }
  }
  
  // 6. Brand if available
  const brandName = formatClothingBrand(clothingBrand);
  if (brandName) {
    parts.push(brandName);
  }
  
  // 7. Season if available
  const seasonName = formatSeason(season);
  if (seasonName) {
    parts.push(seasonName);
  }
  
  // 8. Digital Download indicator
  parts.push('Digital Download');
  
  let title = parts.join(' | ');
  
  // Truncate if over 140 chars - remove last segments progressively
  while (title.length > 140 && parts.length > 3) {
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
 * Advertises 2 books: 1 full-color book + 1 coloring book
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
  
  let description = `✨ INSTANT DOWNLOAD - 2 BOOKS INCLUDED! ✨\n\n`;
  
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
  
  // What You Get section - emphasize 2 books
  description += `📦 WHAT YOU GET (2 BOOKS!):\n`;
  description += `• 1 Full-Color Picture Book (${pageCount} pages) - Beautiful illustrations to read and enjoy\n`;
  description += `• 1 Coloring Book (${pageCount} pages) - Black & white pages ready to color\n`;
  description += `• Print as many times as you like\n`;
  description += `• Perfect for ${ageGroup} children\n`;
  if (theme) {
    description += `• Adorable ${theme.toLowerCase()} characters throughout\n`;
  }
  description += `\n`;
  
  // Perfect For section
  description += `🎨 PERFECT FOR:\n`;
  description += `• Reading time with full-color book\n`;
  description += `• Coloring activities with printable book\n`;
  description += `• Homeschool learning\n`;
  description += `• Travel entertainment\n`;
  description += `• Classroom activities\n`;
  description += `• Birthday party favors\n\n`;
  
  // How It Works section
  description += `📋 HOW IT WORKS:\n`;
  description += `1. Purchase and download instantly (2 PDF files)\n`;
  description += `2. Enjoy the full-color book on screen or print it\n`;
  description += `3. Print the coloring book and start coloring!\n\n`;
  
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
      case 'sight-words':
        description += `This sight words book helps early readers recognize high-frequency words for fluent reading.\n\n`;
        break;
      case 'opposites':
        description += `This opposites book teaches comparison concepts and vocabulary building.\n\n`;
        break;
      case 'manners':
        description += `This manners book teaches social skills and polite behavior through fun illustrations.\n\n`;
        break;
      default:
        description += `This educational coloring book makes learning fun and accessible for young learners.\n\n`;
    }
  }
  
  // Disclaimer
  description += `⚠️ This is a DIGITAL DOWNLOAD - no physical product will be shipped.\n`;
  description += `📁 You will receive 2 PDF files: 1 full-color book + 1 coloring book.\n\n`;
  description += `💖 Thank you for supporting Shelly and Thatch!`;
  
  return description;
}

/**
 * Generate Etsy tags (max 13, each max 20 chars)
 * Incorporates all discovery attributes: theme, book type, location, season, environment, brand, etc.
 */
function generateTags(
  bookType: string | null,
  characterTheme: string | null,
  targetAge: string | null,
  city: string | null,
  resort: string | null,
  season: string | null,
  location: string | null,
  environment: string | null,
  clothingBrand: string | null,
  gradeLevel: string | null,
  mannerType: string | null,
  mannersSetting: string | null
): string[] {
  const tags: string[] = [];
  const theme = formatTheme(characterTheme);
  const ageKeyword = getAgeKeyword(targetAge);
  const locationName = formatResort(resort) || formatCity(city) || formatCity(location);
  const seasonName = formatSeason(season);
  const envName = formatEnvironment(environment);
  const brandName = formatClothingBrand(clothingBrand);
  const gradeName = formatGradeLevel(gradeLevel);
  
  // Book type specific tags - these are highest priority
  if (bookType) {
    switch (bookType.toLowerCase()) {
      case 'abc':
        tags.push('abc coloring book', 'alphabet printable', 'letter learning');
        break;
      case 'numbers':
        tags.push('counting book', 'numbers printable', 'math activities');
        break;
      case 'shapes':
        tags.push('shapes printable', 'shape learning');
        break;
      case 'rhyming':
        tags.push('rhyming book', 'phonics printable');
        break;
      case 'opposites':
        tags.push('opposites book', 'learning opposites');
        break;
      case 'digraphs':
        tags.push('phonics book', 'reading practice');
        break;
      case 'feelings':
        tags.push('feelings book', 'emotions learning');
        break;
      case 'bedtime':
        tags.push('bedtime book', 'sleep routine');
        break;
      case 'manners':
        tags.push('manners book', 'social skills');
        break;
      case 'sight-words':
        tags.push('sight words', 'reading practice');
        break;
      case 'first-words':
        tags.push('first words', 'vocabulary book');
        break;
      case 'animals':
        tags.push('animal coloring', 'animals printable');
        break;
      case 'cvc':
        tags.push('cvc words', 'phonics practice');
        break;
      default:
        tags.push('kids coloring book');
    }
  }
  
  // Theme tag - important for character-based books
  if (theme && theme.length <= 14) {
    tags.push(`${theme.toLowerCase()} coloring`.substring(0, 20));
    // Add theme alone if short enough
    if (theme.length <= 20) {
      tags.push(theme.toLowerCase());
    }
  }
  
  // Location tag (city or resort) - great for local SEO
  if (locationName && locationName.length <= 14) {
    tags.push(`${locationName.toLowerCase()} book`.substring(0, 20));
  }
  
  // Season tag - seasonal relevance
  if (seasonName) {
    tags.push(`${seasonName.toLowerCase()} coloring`.substring(0, 20));
    tags.push(`${seasonName.toLowerCase()} activity`.substring(0, 20));
  }
  
  // Environment tag
  if (envName && envName.length <= 12) {
    tags.push(`${envName.toLowerCase()} theme`.substring(0, 20));
  }
  
  // Clothing brand tag - for branded content
  if (brandName && brandName.length <= 12) {
    tags.push(`${brandName.toLowerCase()} kids`.substring(0, 20));
  }
  
  // Grade level tag
  if (gradeName && gradeName.length <= 14) {
    tags.push(`${gradeName.toLowerCase()}`.substring(0, 20));
  }
  
  // Manners specific tags
  if (mannerType) {
    const mannerTag = mannerType.toLowerCase().replace(/_/g, ' ');
    if (mannerTag.length <= 20) {
      tags.push(mannerTag);
    }
  }
  
  if (mannersSetting) {
    const settingTag = `${mannersSetting.toLowerCase().replace(/_/g, ' ')} manners`;
    if (settingTag.length <= 20) {
      tags.push(settingTag.substring(0, 20));
    }
  }
  
  // Age group tags
  tags.push(`${ageKeyword.toLowerCase()} activities`.substring(0, 20));
  tags.push(`${ageKeyword.toLowerCase()} printable`.substring(0, 20));
  
  // General tags (fill remaining slots)
  tags.push('coloring pages');
  tags.push('digital download');
  tags.push('instant download');
  tags.push('printable pages');
  tags.push('kids activity');
  tags.push('homeschool');
  
  // Dedupe and limit to 13
  const uniqueTags = [...new Set(tags)]
    .filter(tag => tag.length > 0 && tag.length <= 20)
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
  season,
  location,
  environment,
  clothingBrand,
  gradeLevel,
  mannerType,
  mannersSetting,
}: EtsyListingParams): EtsyListing {
  const title = generateTitle(
    bookName, 
    bookType, 
    characterTheme, 
    targetAge, 
    pageCount, 
    city || null, 
    resort || null, 
    season || null, 
    gradeLevel || null,
    clothingBrand || null
  );
  const description = generateDescription(bookName, bookDescription, bookType, characterTheme, targetAge, pageCount);
  const tags = generateTags(
    bookType, 
    characterTheme, 
    targetAge, 
    city || null, 
    resort || null,
    season || null,
    location || null,
    environment || null,
    clothingBrand || null,
    gradeLevel || null,
    mannerType || null,
    mannersSetting || null
  );
  
  const fileName = generateEtsyFileName(bookName);
  
  return {
    title,
    description,
    tags,
    fileName,
  };
}
