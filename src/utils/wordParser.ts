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

// Common consonant digraphs that should stay together
const DIGRAPHS = ['ch', 'sh', 'th', 'wh', 'ph', 'gh', 'ck', 'ng', 'qu'];

// Common consonant blends that start syllables
const BLENDS = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'scr', 'spl', 'spr', 'str', 'thr'];

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
 * Check if a string is a consonant digraph
 */
function isDigraph(str: string): boolean {
  return DIGRAPHS.includes(str.toLowerCase());
}

/**
 * Check if a string starts a syllable (blend)
 */
function isBlend(str: string): boolean {
  return BLENDS.includes(str.toLowerCase());
}

/**
 * Segment a word into syllables using phonetic rules
 * Based on standard English syllabification patterns
 */
export function segmentIntoSyllables(word: string): string[] {
  if (!word || word.length === 0) return [];
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return [word];
  
  const targetCount = getSyllableCount(cleanWord);
  
  // Single syllable words
  if (targetCount === 1) {
    return [cleanWord];
  }
  
  // Handle consonant-le endings (ble, dle, gle, ple, tle, etc.)
  // These always form their own syllable
  const cleMatch = cleanWord.match(/^(.+?)([bcdfgkpstvz]le)$/);
  if (cleMatch && cleMatch[1].length > 0) {
    const base = cleMatch[1];
    const ending = cleMatch[2];
    
    if (targetCount === 2) {
      return [base, ending];
    } else {
      const baseSegments = segmentIntoSyllables(base);
      // Adjust to target count
      while (baseSegments.length + 1 > targetCount && baseSegments.length > 1) {
        baseSegments[baseSegments.length - 2] += baseSegments[baseSegments.length - 1];
        baseSegments.pop();
      }
      return [...baseSegments, ending];
    }
  }
  
  // Handle -tion, -sion endings
  const tionMatch = cleanWord.match(/^(.+?)(tion|sion)$/);
  if (tionMatch && tionMatch[1].length > 0) {
    const base = tionMatch[1];
    const ending = tionMatch[2];
    
    if (targetCount === 2) {
      return [base, ending];
    } else {
      const baseSegments = segmentIntoSyllables(base);
      while (baseSegments.length + 1 > targetCount && baseSegments.length > 1) {
        baseSegments[baseSegments.length - 2] += baseSegments[baseSegments.length - 1];
        baseSegments.pop();
      }
      return [...baseSegments, ending];
    }
  }
  
  // Find all vowel positions (treating consecutive vowels as one unit)
  const vowelGroups: { start: number; end: number }[] = [];
  let i = 0;
  while (i < cleanWord.length) {
    if (isVowel(cleanWord[i])) {
      const start = i;
      while (i < cleanWord.length && isVowel(cleanWord[i])) {
        i++;
      }
      vowelGroups.push({ start, end: i - 1 });
    } else {
      i++;
    }
  }
  
  if (vowelGroups.length === 0) {
    return [cleanWord];
  }
  
  if (vowelGroups.length === 1) {
    return [cleanWord];
  }
  
  // Find split points between vowel groups
  const splitPoints: number[] = [];
  
  for (let v = 0; v < vowelGroups.length - 1; v++) {
    const currentEnd = vowelGroups[v].end;
    const nextStart = vowelGroups[v + 1].start;
    const consonants = cleanWord.substring(currentEnd + 1, nextStart);
    const numConsonants = consonants.length;
    
    if (numConsonants === 0) {
      // VV pattern - split between vowels
      splitPoints.push(currentEnd + 1);
    } else if (numConsonants === 1) {
      // VCV pattern - consonant usually goes with second syllable
      splitPoints.push(currentEnd + 1);
    } else if (numConsonants === 2) {
      // VCCV pattern
      const pair = consonants;
      
      // Double consonants split between them (lad-der, ap-ple)
      if (pair[0] === pair[1]) {
        splitPoints.push(currentEnd + 2);
      }
      // Digraphs stay together with second syllable
      else if (isDigraph(pair)) {
        splitPoints.push(currentEnd + 1);
      }
      // Blends stay together with second syllable
      else if (isBlend(pair)) {
        splitPoints.push(currentEnd + 1);
      }
      // Otherwise split between consonants
      else {
        splitPoints.push(currentEnd + 2);
      }
    } else {
      // VCCCV or more - find where to split
      // Check if last 2-3 consonants form a blend
      let splitAt = currentEnd + 2; // Default after first consonant
      
      for (let len = Math.min(3, numConsonants); len >= 2; len--) {
        const endPart = consonants.substring(numConsonants - len);
        if (isBlend(endPart) || isDigraph(endPart)) {
          splitAt = currentEnd + 1 + (numConsonants - len);
          break;
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
  
  if (lastSplit < cleanWord.length) {
    segments.push(cleanWord.substring(lastSplit));
  }
  
  // Adjust to match target syllable count
  return adjustToTarget(segments, targetCount);
}

/**
 * Adjust segment count to match target
 */
function adjustToTarget(segments: string[], target: number): string[] {
  if (segments.length === target) {
    return segments;
  }
  
  const result = [...segments];
  
  // If too many segments, merge smallest adjacent pairs
  while (result.length > target && result.length > 1) {
    let minIdx = 0;
    let minLen = result[0].length + result[1].length;
    
    for (let i = 1; i < result.length - 1; i++) {
      const combined = result[i].length + result[i + 1].length;
      if (combined < minLen) {
        minLen = combined;
        minIdx = i;
      }
    }
    
    result[minIdx] = result[minIdx] + result[minIdx + 1];
    result.splice(minIdx + 1, 1);
  }
  
  // If too few segments, split largest segment
  while (result.length < target) {
    let maxIdx = 0;
    let maxLen = 0;
    
    for (let i = 0; i < result.length; i++) {
      if (result[i].length > maxLen) {
        maxLen = result[i].length;
        maxIdx = i;
      }
    }
    
    const seg = result[maxIdx];
    if (seg.length < 2) break;
    
    // Try to split at a consonant-vowel boundary
    let splitAt = Math.floor(seg.length / 2);
    for (let i = 1; i < seg.length; i++) {
      if (isConsonant(seg[i - 1]) && isVowel(seg[i])) {
        splitAt = i;
        break;
      }
    }
    
    result.splice(maxIdx, 1, seg.substring(0, splitAt), seg.substring(splitAt));
  }
  
  return result;
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
