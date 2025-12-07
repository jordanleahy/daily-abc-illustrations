/**
 * Word and Letter Parsing Utilities
 * Provides functions to parse text into educational metadata
 * Uses Datamuse API via edge function for accurate syllable data
 */

import { syllable } from 'syllable';
import { supabase } from '@/integrations/supabase/client';

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
 * Get syllable count using the syllable package (local fallback)
 */
export function getSyllableCount(word: string): number {
  if (!word || word.length === 0) return 0;
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return 0;
  return Math.max(1, syllable(cleanWord));
}

/**
 * Local fallback syllable segmentation
 */
export function segmentIntoSyllables(word: string): string[] {
  if (!word || word.length === 0) return [];
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return [word];
  
  const syllableCount = getSyllableCount(cleanWord);
  
  if (syllableCount === 1) {
    return [cleanWord];
  }
  
  // Simple proportional split as fallback
  const segmentLength = Math.ceil(cleanWord.length / syllableCount);
  const segments: string[] = [];
  
  for (let i = 0; i < syllableCount; i++) {
    const start = i * segmentLength;
    const end = Math.min(start + segmentLength, cleanWord.length);
    if (start < cleanWord.length) {
      segments.push(cleanWord.substring(start, end));
    }
  }
  
  return segments;
}

/**
 * Fetch accurate syllable data from Datamuse API via edge function
 */
export async function fetchSyllableData(words: string[]): Promise<Map<string, { syllableCount: number; segments: string[] }>> {
  const result = new Map<string, { syllableCount: number; segments: string[] }>();
  
  if (!words || words.length === 0) {
    return result;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('get-word-syllables', {
      body: { words }
    });
    
    if (error) {
      console.error('Error fetching syllable data:', error);
      return result;
    }
    
    if (data?.results) {
      for (const item of data.results) {
        result.set(item.word.toLowerCase(), {
          syllableCount: item.syllableCount,
          segments: item.segments
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error calling syllable API:', error);
    return result;
  }
}

/**
 * Basic part of speech detection (simplified)
 */
export function detectPartOfSpeech(word: string): string | undefined {
  const lower = word.toLowerCase();
  
  const prepositions = ['for', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'of', 'about'];
  if (prepositions.includes(lower)) return 'preposition';
  
  const articles = ['a', 'an', 'the'];
  if (articles.includes(lower)) return 'article';
  
  const conjunctions = ['and', 'but', 'or', 'so', 'yet'];
  if (conjunctions.includes(lower)) return 'conjunction';
  
  const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
  if (pronouns.includes(lower)) return 'pronoun';
  
  const beVerbs = ['is', 'are', 'was', 'were', 'am', 'be', 'been', 'being'];
  if (beVerbs.includes(lower)) return 'verb';
  
  return 'noun';
}

/**
 * Parse title text into word metadata array (synchronous, uses local fallback)
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
 * Parse title text with accurate syllable data from API (async)
 */
export async function parseWordsFromTitleAsync(title: string): Promise<WordMetadata[]> {
  if (!title || title.trim().length === 0) return [];
  
  const words = title.split(/\s+/).filter(word => word.length > 0);
  const cleanWords = words.map(w => w.replace(/[.,!?;:'"]/g, ''));
  
  // Fetch accurate syllable data from API
  const syllableData = await fetchSyllableData(cleanWords);
  
  return words.map((word, index) => {
    const cleanWord = word.replace(/[.,!?;:'"]/g, '');
    const lowerWord = cleanWord.toLowerCase();
    
    // Use API data if available, otherwise fall back to local
    const apiData = syllableData.get(lowerWord);
    const syllableCount = apiData?.syllableCount ?? getSyllableCount(cleanWord);
    const segments = apiData?.segments ?? segmentIntoSyllables(cleanWord);
    
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
 * Legacy functions for backward compatibility
 */
export function breakIntoSyllables(word: string): string {
  const segments = segmentIntoSyllables(word);
  return segments.join('-');
}

export function estimateSyllables(word: string): number {
  return getSyllableCount(word);
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
