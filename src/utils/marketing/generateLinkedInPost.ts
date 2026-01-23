/**
 * LinkedIn Post Generator
 * Creates professional, education-focused content for LinkedIn
 */

interface LinkedInPostParams {
  bookName: string;
  bookDescription: string | null;
  characterTheme: string | null;
  marketingUrl: string;
  bookType?: string | null;
  season?: string | null;
  environment?: string | null;
  location?: string | null;
  targetAge?: string | null;
}

interface LinkedInPost {
  post: string;
  hashtags: string;
  fullPost: string;
}

/**
 * Format character theme for professional display
 */
function formatTheme(theme: string | null): string {
  if (!theme) return '';
  
  const themeMap: Record<string, string> = {
    bears: 'Bear Characters',
    dinosaurs: 'Dinosaur Characters',
    dogs: 'Dog Characters',
    cats: 'Cat Characters',
    unicorns: 'Unicorn Characters',
    dragons: 'Dragon Characters',
    robots: 'Robot Characters',
    bunnies: 'Bunny Characters',
    owls: 'Owl Characters',
    foxes: 'Fox Characters',
    penguins: 'Penguin Characters',
    elephants: 'Elephant Characters',
    lions: 'Lion Characters',
    monkeys: 'Monkey Characters',
    pandas: 'Panda Characters',
    tigers: 'Tiger Characters',
    koalas: 'Koala Characters',
    giraffes: 'Giraffe Characters',
    zebras: 'Zebra Characters',
    hippos: 'Hippo Characters',
  };
  
  return themeMap[theme.toLowerCase()] || theme;
}

/**
 * Get book type display info for professional context
 */
function getBookTypeInfo(bookType: string | null): { displayName: string; educationalFocus: string } {
  if (!bookType) return { displayName: 'Children\'s Book', educationalFocus: 'early literacy' };
  
  const typeMap: Record<string, { displayName: string; educationalFocus: string }> = {
    abc: { displayName: 'ABC Alphabet Book', educationalFocus: 'letter recognition and phonics' },
    numbers: { displayName: 'Numbers & Counting Book', educationalFocus: 'numerical literacy' },
    rhyming: { displayName: 'Rhyming Book', educationalFocus: 'phonological awareness' },
    digraphs: { displayName: 'Phonics Book', educationalFocus: 'reading comprehension' },
    colors: { displayName: 'Colors Book', educationalFocus: 'color recognition' },
    shapes: { displayName: 'Shapes Book', educationalFocus: 'spatial awareness' },
  };
  
  return typeMap[bookType.toLowerCase()] || { displayName: 'Children\'s Book', educationalFocus: 'early learning' };
}

/**
 * Get age display for professional context
 */
function getAgeDisplay(targetAge: string | null): string {
  if (!targetAge) return 'young learners';
  
  const ageMap: Record<string, string> = {
    'infant': 'infants (0-1 years)',
    'toddler': 'toddlers (1-3 years)',
    'preschool': 'preschoolers (3-5 years)',
    'kindergarten': 'kindergarteners (5-6 years)',
    'early-elementary': 'early elementary students (6-8 years)',
  };
  
  return ageMap[targetAge] || 'young learners';
}

/**
 * Generate professional LinkedIn hashtags
 */
function generateLinkedInHashtags(
  bookType: string | null,
  characterTheme: string | null
): string[] {
  const hashtags: string[] = [
    '#EarlyChildhoodEducation',
    '#KidsBooks',
    '#LiteracyMatters',
  ];
  
  // Add book type specific hashtags
  if (bookType) {
    const typeHashtags: Record<string, string[]> = {
      abc: ['#ABCBooks', '#Phonics'],
      numbers: ['#MathLiteracy', '#CountingBooks'],
      rhyming: ['#RhymingBooks', '#LanguageDevelopment'],
      digraphs: ['#Phonics', '#ReadingSkills'],
      colors: ['#ColorLearning', '#PreschoolActivities'],
      shapes: ['#ShapeLearning', '#EarlyMath'],
    };
    
    const typeSpecific = typeHashtags[bookType.toLowerCase()];
    if (typeSpecific) {
      hashtags.push(...typeSpecific);
    }
  }
  
  // Add general education hashtags
  hashtags.push('#ParentingTips', '#TeacherResources');
  
  // Limit to 5-7 hashtags for LinkedIn
  return [...new Set(hashtags)].slice(0, 7);
}

/**
 * Generate the main post content
 */
function generatePostContent(
  bookName: string,
  bookDescription: string | null,
  bookType: string | null,
  characterTheme: string | null,
  targetAge: string | null,
  marketingUrl: string
): string {
  const { displayName, educationalFocus } = getBookTypeInfo(bookType);
  const ageGroup = getAgeDisplay(targetAge);
  const theme = formatTheme(characterTheme);
  
  // Professional opening hook
  let post = `📚 New Educational Resource for ${ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1)}\n\n`;
  
  // Book introduction
  post += `I'm excited to share "${bookName}" — a beautifully illustrated ${displayName.toLowerCase()} designed to support ${educationalFocus}.\n\n`;
  
  // Add description if available
  if (bookDescription) {
    // Take first 2 sentences for professional brevity
    const sentences = bookDescription.split(/[.!?]+/).filter(s => s.trim());
    const shortDesc = sentences.slice(0, 2).join('. ').trim();
    if (shortDesc) {
      post += `${shortDesc}.\n\n`;
    }
  }
  
  // Key features with professional framing
  post += `✨ Key Features:\n`;
  post += `• AI-generated illustrations tailored for young learners\n`;
  
  if (theme) {
    post += `• Engaging ${theme.toLowerCase()} throughout the book\n`;
  }
  
  post += `• Designed to make learning fun and accessible\n`;
  post += `• Perfect for parents, teachers, and caregivers\n\n`;
  
  // Professional call-to-action
  post += `📖 Explore the book here:\n${marketingUrl}\n\n`;
  
  post += `I'd love to hear your thoughts on making early education more engaging. What resources have worked best for the young learners in your life?`;
  
  return post;
}

/**
 * Main export: Generate complete LinkedIn post
 */
export function generateLinkedInPost({
  bookName,
  bookDescription,
  characterTheme,
  marketingUrl,
  bookType,
  targetAge,
}: LinkedInPostParams): LinkedInPost {
  const post = generatePostContent(
    bookName,
    bookDescription,
    bookType || null,
    characterTheme,
    targetAge || null,
    marketingUrl
  );
  
  const hashtagsArray = generateLinkedInHashtags(bookType || null, characterTheme);
  const hashtags = hashtagsArray.join(' ');
  
  const fullPost = `${post}\n\n${hashtags}`;
  
  return {
    post,
    hashtags,
    fullPost,
  };
}
