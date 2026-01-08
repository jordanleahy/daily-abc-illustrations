// Sight Words Corpus v1 - Dolch Word Lists by Level
// Import directly into edge functions for 0ms latency lookups
// Based on the Dolch word list - high-frequency words essential for reading

export type SightWordLevel = 'pre-primer' | 'primer' | 'first-grade' | 'second-grade';

export interface SightWordEntry {
  word: string;
  level: SightWordLevel;
}

export interface SightWordsCorpus {
  metadata: {
    corpus_version: string;
    source: string;
    scope: string;
  };
  levels: SightWordLevel[];
  words: Record<SightWordLevel, string[]>;
}

export const SIGHT_WORDS_CORPUS: SightWordsCorpus = {
  metadata: {
    corpus_version: "v1",
    source: "Dolch Word List",
    scope: "High-frequency sight words for Pre-K through Grade 2"
  },
  levels: ['pre-primer', 'primer', 'first-grade', 'second-grade'],
  words: {
    'pre-primer': [
      'the', 'a', 'I', 'see', 'can', 'we', 'to', 'and', 'you', 'is',
      'it', 'my', 'go', 'like', 'me', 'in', 'up', 'at', 'no', 'on',
      'for', 'he', 'run', 'big', 'not', 'one', 'two', 'three', 'blue', 'red',
      'yellow', 'come', 'said', 'play', 'where', 'look', 'find', 'here', 'make', 'funny'
    ],
    'primer': [
      'he', 'she', 'was', 'said', 'are', 'they', 'have', 'that', 'with', 'this',
      'not', 'but', 'what', 'all', 'her', 'him', 'do', 'did', 'so', 'get',
      'out', 'now', 'new', 'came', 'our', 'ate', 'say', 'under', 'please', 'pretty',
      'four', 'want', 'too', 'must', 'good', 'into', 'brown', 'eat', 'well', 'ran',
      'ride', 'saw', 'soon', 'who', 'am', 'yes', 'be', 'black', 'white', 'there'
    ],
    'first-grade': [
      'from', 'have', 'were', 'could', 'would', 'your', 'there', 'them', 'some', 'when',
      'than', 'then', 'over', 'into', 'just', 'make', 'know', 'very', 'only', 'how',
      'after', 'think', 'let', 'put', 'take', 'every', 'old', 'by', 'going', 'walk',
      'again', 'may', 'stop', 'fly', 'round', 'give', 'once', 'open', 'has', 'her',
      'his', 'ask', 'live', 'any', 'of', 'thank', 'had'
    ],
    'second-grade': [
      'around', 'because', 'together', 'always', 'before', 'these', 'those', 'many', 'first', 'about',
      'been', 'called', 'people', 'write', 'water', 'again', 'away', 'every', 'should', 'thought',
      'does', 'don\'t', 'right', 'which', 'their', 'long', 'made', 'upon', 'tell', 'pull',
      'read', 'both', 'sit', 'why', 'found', 'use', 'fast', 'or', 'its', 'would',
      'work', 'call', 'sing', 'sleep', 'wish', 'best', 'off', 'cold', 'green'
    ]
  }
};

/**
 * Get all words for a specific sight word level
 */
export function getWordsForLevel(level: SightWordLevel): string[] {
  return SIGHT_WORDS_CORPUS.words[level] || [];
}

/**
 * Get words up to and including a specific level
 */
export function getWordsThroughLevel(level: SightWordLevel): SightWordEntry[] {
  const levelOrder: SightWordLevel[] = ['pre-primer', 'primer', 'first-grade', 'second-grade'];
  const targetIndex = levelOrder.indexOf(level);
  
  const result: SightWordEntry[] = [];
  for (let i = 0; i <= targetIndex; i++) {
    const lvl = levelOrder[i];
    for (const word of SIGHT_WORDS_CORPUS.words[lvl]) {
      result.push({ word, level: lvl });
    }
  }
  return result;
}

/**
 * Check if a level is valid
 */
export function isValidSightWordLevel(level: string): level is SightWordLevel {
  return ['pre-primer', 'primer', 'first-grade', 'second-grade'].includes(level);
}

/**
 * Get display label for a sight word level
 */
export function getSightWordLevelLabel(level: SightWordLevel): string {
  const labels: Record<SightWordLevel, string> = {
    'pre-primer': 'Pre-Primer',
    'primer': 'Primer',
    'first-grade': 'First Grade',
    'second-grade': 'Second Grade'
  };
  return labels[level] || level;
}

/**
 * Get the first N words for a level (useful for cover display)
 */
export function getTopWordsForLevel(level: SightWordLevel, count: number = 6): string[] {
  const words = getWordsForLevel(level);
  return words.slice(0, count);
}
