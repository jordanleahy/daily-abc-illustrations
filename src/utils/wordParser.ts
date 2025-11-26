/**
 * Word and Letter Parsing Utilities
 * Provides functions to parse text into educational metadata
 */

export interface LetterMetadata {
  letter: string;
  position: number;
  isVowel: boolean;
  isConsonant: boolean;
}

export interface WordMetadata {
  word: string;
  order: number;
  syllableCount?: number;
  syllableBreakdown?: string;
  partOfSpeech?: string;
  letters?: LetterMetadata[];
}

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const VOWELS_UPPER = ['A', 'E', 'I', 'O', 'U'];

/**
 * Check if a character is a vowel
 */
export function isVowel(char: string): boolean {
  const lower = char.toLowerCase();
  return VOWELS.includes(lower);
}

/**
 * Check if a character is a consonant (letter but not vowel)
 */
export function isConsonant(char: string): boolean {
  const lower = char.toLowerCase();
  return /^[a-z]$/i.test(char) && !VOWELS.includes(lower);
}

/**
 * Parse a word into letter metadata
 */
export function parseLetters(word: string): LetterMetadata[] {
  return word.split('').map((char, index) => ({
    letter: char,
    position: index,
    isVowel: isVowel(char),
    isConsonant: isConsonant(char)
  }));
}

/**
 * Estimate syllable count using basic rules
 * This is a simplified algorithm - can be enhanced later
 */
export function estimateSyllables(word: string): number {
  if (!word || word.length === 0) return 0;
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return 0;
  
  // Count vowel groups
  let syllables = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const char = cleanWord[i];
    const currentIsVowel = VOWELS.includes(char);
    
    if (currentIsVowel && !previousWasVowel) {
      syllables++;
    }
    
    previousWasVowel = currentIsVowel;
  }
  
  // Adjust for silent 'e' at the end
  if (cleanWord.endsWith('e') && syllables > 1) {
    syllables--;
  }
  
  // Every word has at least one syllable
  return Math.max(1, syllables);
}

/**
 * Break word into syllables (simplified algorithm)
 */
export function breakIntoSyllables(word: string): string {
  if (!word || word.length === 0) return '';
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return word;
  
  // For Phase 1, just return the word as-is
  // This can be enhanced with more sophisticated syllable splitting
  const syllableCount = estimateSyllables(cleanWord);
  
  if (syllableCount === 1) {
    return cleanWord;
  }
  
  // Simple split: try to divide at vowel-consonant boundaries
  const parts: string[] = [];
  let currentPart = '';
  let previousWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const char = cleanWord[i];
    const currentIsVowel = VOWELS.includes(char);
    
    if (previousWasVowel && !currentIsVowel && currentPart.length > 0) {
      parts.push(currentPart);
      currentPart = char;
    } else {
      currentPart += char;
    }
    
    previousWasVowel = currentIsVowel;
  }
  
  if (currentPart.length > 0) {
    parts.push(currentPart);
  }
  
  return parts.length > 0 ? parts.join('-') : cleanWord;
}

/**
 * Basic part of speech detection (very simplified)
 * This can be enhanced with NLP libraries or AI later
 */
export function detectPartOfSpeech(word: string): string | undefined {
  const lower = word.toLowerCase();
  
  // Common prepositions
  const prepositions = ['for', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'of', 'about'];
  if (prepositions.includes(lower)) return 'preposition';
  
  // Common articles
  const articles = ['a', 'an', 'the'];
  if (articles.includes(lower)) return 'article';
  
  // Common conjunctions
  const conjunctions = ['and', 'but', 'or', 'so', 'yet'];
  if (conjunctions.includes(lower)) return 'conjunction';
  
  // Common pronouns
  const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
  if (pronouns.includes(lower)) return 'pronoun';
  
  // Common verbs (to be)
  const beVerbs = ['is', 'are', 'was', 'were', 'am', 'be', 'been', 'being'];
  if (beVerbs.includes(lower)) return 'verb';
  
  // Default to noun for most other words
  return 'noun';
}

/**
 * Parse title text into word metadata array
 */
export function parseWordsFromTitle(title: string): WordMetadata[] {
  if (!title || title.trim().length === 0) return [];
  
  const words = title.split(/\s+/).filter(word => word.length > 0);
  
  return words.map((word, index) => {
    const cleanWord = word.replace(/[.,!?;:'"]/g, '');
    
    return {
      word: cleanWord,
      order: index,
      syllableCount: estimateSyllables(cleanWord),
      syllableBreakdown: breakIntoSyllables(cleanWord),
      partOfSpeech: detectPartOfSpeech(cleanWord),
      letters: parseLetters(cleanWord)
    };
  });
}

/**
 * Update page content with word metadata
 */
export function addWordMetadataToContent(
  content: Record<string, unknown>,
  title: string
): Record<string, unknown> & { words: WordMetadata[] } {
  const words = parseWordsFromTitle(title);
  
  return {
    ...content,
    words
  };
}
