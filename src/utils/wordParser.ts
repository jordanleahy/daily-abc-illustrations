/**
 * Word and Letter Parsing Utilities
 * Provides functions to parse text into educational metadata
 * Uses 'syllable' package for accurate syllable counts
 */

import { syllable } from 'syllable';

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

// Common consonant digraphs that should not be split
const CONSONANT_DIGRAPHS = ['ch', 'sh', 'th', 'wh', 'ph', 'gh', 'ck', 'ng', 'qu'];

// Common consonant blends at the start of syllables
const INITIAL_BLENDS = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'scr', 'spl', 'spr', 'str', 'thr'];

// Common endings that form their own syllable
const SYLLABIC_ENDINGS = ['ble', 'cle', 'dle', 'fle', 'gle', 'kle', 'ple', 'tle', 'zle', 'tion', 'sion'];

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
 * Check if a substring is a consonant digraph
 */
function isDigraph(str: string): boolean {
  return CONSONANT_DIGRAPHS.includes(str.toLowerCase());
}

/**
 * Check if a substring is an initial blend
 */
function isInitialBlend(str: string): boolean {
  return INITIAL_BLENDS.includes(str.toLowerCase());
}

/**
 * Find vowel positions in a word
 */
function findVowelPositions(word: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (isVowel(word[i])) {
      positions.push(i);
    }
  }
  return positions;
}

/**
 * Segment a word into syllables using English phonetic patterns
 * This is a deterministic algorithm based on:
 * 1. Vowel-consonant-vowel (VCV) patterns
 * 2. Consonant digraphs and blends
 * 3. Common syllabic endings
 */
export function segmentIntoSyllables(word: string, targetCount?: number): string[] {
  if (!word || word.length === 0) return [];
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return [word];
  
  // Get the target syllable count
  const syllableCount = targetCount ?? getSyllableCount(cleanWord);
  
  // Single syllable words
  if (syllableCount === 1) {
    return [cleanWord];
  }
  
  // Find vowel positions (these are syllable nuclei)
  const vowelPositions = findVowelPositions(cleanWord);
  
  if (vowelPositions.length === 0) {
    return [cleanWord];
  }
  
  // Merge consecutive vowels (diphthongs/vowel teams)
  const vowelGroups: { start: number; end: number }[] = [];
  let currentGroup = { start: vowelPositions[0], end: vowelPositions[0] };
  
  for (let i = 1; i < vowelPositions.length; i++) {
    if (vowelPositions[i] === currentGroup.end + 1) {
      // Consecutive vowel - extend the group
      currentGroup.end = vowelPositions[i];
    } else {
      vowelGroups.push({ ...currentGroup });
      currentGroup = { start: vowelPositions[i], end: vowelPositions[i] };
    }
  }
  vowelGroups.push(currentGroup);
  
  // If we have fewer vowel groups than syllables, just split evenly
  if (vowelGroups.length < syllableCount) {
    return splitEvenly(cleanWord, syllableCount);
  }
  
  // Find split points between vowel groups
  const splitPoints: number[] = [];
  
  for (let i = 0; i < vowelGroups.length - 1; i++) {
    const currentEnd = vowelGroups[i].end;
    const nextStart = vowelGroups[i + 1].start;
    const consonantsBetween = nextStart - currentEnd - 1;
    
    if (consonantsBetween === 0) {
      // No consonants between vowels - split after first vowel group
      splitPoints.push(currentEnd + 1);
    } else if (consonantsBetween === 1) {
      // One consonant - it goes with the next syllable (open syllable pattern)
      splitPoints.push(currentEnd + 1);
    } else if (consonantsBetween === 2) {
      // Two consonants - check for digraphs and blends
      const consonantPair = cleanWord.substring(currentEnd + 1, nextStart);
      
      if (isDigraph(consonantPair) || isInitialBlend(consonantPair)) {
        // Keep the pair together with the next syllable
        splitPoints.push(currentEnd + 1);
      } else {
        // Split between the consonants
        splitPoints.push(currentEnd + 2);
      }
    } else {
      // Three or more consonants - find the best split point
      const consonants = cleanWord.substring(currentEnd + 1, nextStart);
      let splitAt = currentEnd + 2; // Default: after first consonant
      
      // Check if the last 2-3 consonants form a blend
      for (let len = 3; len >= 2; len--) {
        if (consonants.length >= len) {
          const endBlend = consonants.substring(consonants.length - len);
          if (isInitialBlend(endBlend) || isDigraph(endBlend)) {
            splitAt = currentEnd + 1 + (consonants.length - len);
            break;
          }
        }
      }
      
      splitPoints.push(splitAt);
    }
  }
  
  // Build segments from split points
  const segments: string[] = [];
  let lastSplit = 0;
  
  for (const splitPoint of splitPoints) {
    if (splitPoint > lastSplit && splitPoint < cleanWord.length) {
      segments.push(cleanWord.substring(lastSplit, splitPoint));
      lastSplit = splitPoint;
    }
  }
  
  // Add the remaining part
  if (lastSplit < cleanWord.length) {
    segments.push(cleanWord.substring(lastSplit));
  }
  
  // Adjust segment count to match target syllable count
  return adjustSegmentCount(segments, syllableCount);
}

/**
 * Split a word evenly into N parts
 */
function splitEvenly(word: string, count: number): string[] {
  if (count <= 1) return [word];
  
  const segments: string[] = [];
  const partLength = Math.ceil(word.length / count);
  
  for (let i = 0; i < count; i++) {
    const start = i * partLength;
    const end = Math.min(start + partLength, word.length);
    if (start < word.length) {
      segments.push(word.substring(start, end));
    }
  }
  
  return segments;
}

/**
 * Adjust the number of segments to match the target count
 */
function adjustSegmentCount(segments: string[], targetCount: number): string[] {
  if (segments.length === targetCount) {
    return segments;
  }
  
  if (segments.length > targetCount) {
    // Merge smallest adjacent segments
    while (segments.length > targetCount) {
      let minIndex = 0;
      let minLength = Infinity;
      
      for (let i = 0; i < segments.length - 1; i++) {
        const combined = segments[i].length + segments[i + 1].length;
        if (combined < minLength) {
          minLength = combined;
          minIndex = i;
        }
      }
      
      segments[minIndex] = segments[minIndex] + segments[minIndex + 1];
      segments.splice(minIndex + 1, 1);
    }
  } else {
    // Split largest segments
    while (segments.length < targetCount) {
      let maxIndex = 0;
      let maxLength = 0;
      
      for (let i = 0; i < segments.length; i++) {
        if (segments[i].length > maxLength) {
          maxLength = segments[i].length;
          maxIndex = i;
        }
      }
      
      const seg = segments[maxIndex];
      if (seg.length < 2) break; // Can't split further
      
      const mid = Math.ceil(seg.length / 2);
      segments.splice(maxIndex, 1, seg.substring(0, mid), seg.substring(mid));
    }
  }
  
  return segments;
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
    const segments = segmentIntoSyllables(cleanWord, syllableCount);
    
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
