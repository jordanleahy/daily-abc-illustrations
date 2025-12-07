/**
 * Word and Letter Parsing Utilities
 * Provides functions to parse text into educational metadata
 * Uses 'syllable' package for syllable counts and 'hyphen' for segmentation
 */

import { syllable } from 'syllable';
import { hyphenateSync } from 'hyphen/en';

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
  segments?: string[];
  syllableBreakdown?: string;
  partOfSpeech?: string;
  letters?: LetterMetadata[];
}

const VOWELS = ['a', 'e', 'i', 'o', 'u'];

// Soft hyphen character used by the hyphen package
const SOFT_HYPHEN = '\u00AD';

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
 * Get accurate syllable count using the syllable package
 */
export function getSyllableCount(word: string): number {
  if (!word || word.length === 0) return 0;
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return 0;
  return Math.max(1, syllable(cleanWord));
}

/**
 * Segment a word into syllables using the hyphen package
 * Uses Franklin M. Liang's hyphenation algorithm with linguistic patterns
 */
export function segmentIntoSyllables(word: string): string[] {
  if (!word || word.length === 0) return [];
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return [word];
  
  try {
    // hyphenateSync inserts soft hyphens (\u00AD) at syllable boundaries
    const hyphenated = hyphenateSync(cleanWord);
    const segments = hyphenated.split(SOFT_HYPHEN);
    
    // Filter out empty segments and return
    return segments.filter(s => s.length > 0);
  } catch {
    // Fallback: return the word as a single segment
    return [cleanWord];
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use segmentIntoSyllables instead
 */
export function breakIntoSyllables(word: string): string {
  const segments = segmentIntoSyllables(word);
  return segments.join('-');
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use getSyllableCount instead
 */
export function estimateSyllables(word: string): number {
  return getSyllableCount(word);
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
 * Parse title text into word metadata array with syllable segments
 */
export function parseWordsFromTitle(title: string): WordMetadata[] {
  if (!title || title.trim().length === 0) return [];
  
  const words = title.split(/\s+/).filter(word => word.length > 0);
  
  return words.map((word, index) => {
    const cleanWord = word.replace(/[.,!?;:'"]/g, '');
    const syllableCount = getSyllableCount(cleanWord);
    const segments = segmentIntoSyllables(cleanWord);
    
    return {
      word: cleanWord,
      order: index,
      syllableCount,
      segments,
      syllableBreakdown: segments.join('-'),
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
