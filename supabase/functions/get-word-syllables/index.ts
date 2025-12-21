import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatamuseWord {
  word: string;
  score?: number;
  numSyllables?: number;
  tags?: string[];
}

interface SyllableResult {
  word: string;
  syllableCount: number;
  segments: string[];
  syllableBreakdown: string;
  pronunciation?: string;
}

// Common consonant digraphs that should stay together
const DIGRAPHS = ['ch', 'sh', 'th', 'wh', 'ph', 'gh', 'ck', 'ng', 'qu'];

// Common consonant blends that start syllables
const BLENDS = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw'];

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'y'];

function isVowel(char: string): boolean {
  return VOWELS.includes(char.toLowerCase());
}

function isConsonant(char: string): boolean {
  return /^[a-z]$/i.test(char) && !isVowel(char);
}

/**
 * Segment a word into syllables using the known syllable count
 * Uses English phonetic rules for proper splitting
 */
function segmentWithCount(word: string, syllableCount: number): string[] {
  const letters = word.toLowerCase();
  
  if (syllableCount <= 1 || letters.length <= 1) {
    return [letters];
  }
  
  // Handle consonant-le endings (ble, dle, gle, ple, tle, etc.)
  const cleMatch = letters.match(/^(.+?)([bcdfgkpstvz]le)$/);
  if (cleMatch && cleMatch[1].length > 0) {
    const base = cleMatch[1];
    const ending = cleMatch[2];
    
    if (syllableCount === 2) {
      return [base, ending];
    } else {
      const baseSegments = segmentWithCount(base, syllableCount - 1);
      return [...baseSegments, ending];
    }
  }
  
  // Handle -tion, -sion endings
  const tionMatch = letters.match(/^(.+?)(tion|sion)$/);
  if (tionMatch && tionMatch[1].length > 0) {
    const base = tionMatch[1];
    const ending = tionMatch[2];
    
    if (syllableCount === 2) {
      return [base, ending];
    } else {
      const baseSegments = segmentWithCount(base, syllableCount - 1);
      return [...baseSegments, ending];
    }
  }
  
  // Find vowel groups (consecutive vowels treated as one nucleus)
  const vowelGroups: { start: number; end: number }[] = [];
  let i = 0;
  while (i < letters.length) {
    if (isVowel(letters[i])) {
      const start = i;
      while (i < letters.length && isVowel(letters[i])) {
        i++;
      }
      vowelGroups.push({ start, end: i - 1 });
    } else {
      i++;
    }
  }
  
  if (vowelGroups.length <= 1) {
    return [letters];
  }
  
  // Find split points between vowel groups
  const splitPoints: number[] = [];
  
  for (let v = 0; v < vowelGroups.length - 1 && splitPoints.length < syllableCount - 1; v++) {
    const currentEnd = vowelGroups[v].end;
    const nextStart = vowelGroups[v + 1].start;
    const consonants = letters.substring(currentEnd + 1, nextStart);
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
      else if (DIGRAPHS.includes(pair.toLowerCase())) {
        splitPoints.push(currentEnd + 1);
      }
      // Blends stay together with second syllable
      else if (BLENDS.includes(pair.toLowerCase())) {
        splitPoints.push(currentEnd + 1);
      }
      // Otherwise split between consonants
      else {
        splitPoints.push(currentEnd + 2);
      }
    } else {
      // VCCCV or more - check for blends at end
      let splitAt = currentEnd + 2;
      
      for (let len = Math.min(3, numConsonants); len >= 2; len--) {
        const endPart = consonants.substring(numConsonants - len);
        if (BLENDS.includes(endPart.toLowerCase()) || DIGRAPHS.includes(endPart.toLowerCase())) {
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
    if (splitPoint > lastSplit && splitPoint < letters.length) {
      segments.push(letters.substring(lastSplit, splitPoint));
      lastSplit = splitPoint;
    }
  }
  
  if (lastSplit < letters.length) {
    segments.push(letters.substring(lastSplit));
  }
  
  // Adjust to match target syllable count
  return adjustToTarget(segments, syllableCount);
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { words } = await req.json();
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      return new Response(
        JSON.stringify({ error: 'words array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to 20 words per request to avoid API abuse
    const wordsToProcess = words.slice(0, 20);
    
    console.log(`📚 Processing ${wordsToProcess.length} words for syllable data`);
    
    const results: SyllableResult[] = [];
    
    // Process words in parallel with Datamuse API
    const promises = wordsToProcess.map(async (word: string): Promise<SyllableResult> => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      
      if (!cleanWord) {
        return {
          word,
          syllableCount: 0,
          segments: [],
          syllableBreakdown: ''
        };
      }
      
      try {
        // Query Datamuse API with syllable count and pronunciation metadata
        const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&qe=sp&md=sr&max=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Datamuse API error: ${response.status}`);
        }
        
        const data: DatamuseWord[] = await response.json();
        
        if (data.length === 0) {
          // Word not found - use basic estimation
          return {
            word: cleanWord,
            syllableCount: 1,
            segments: [cleanWord],
            syllableBreakdown: cleanWord
          };
        }
        
        const result = data[0];
        const syllableCount = result.numSyllables || 1;
        
        // Extract pronunciation if available
        const pronTag = result.tags?.find(t => t.startsWith('pron:'));
        const pronunciation = pronTag ? pronTag.replace('pron:', '') : undefined;
        
        // Use syllable count from Datamuse with our segmentation logic
        const segments = segmentWithCount(cleanWord, syllableCount);
        
        return {
          word: cleanWord,
          syllableCount,
          segments,
          syllableBreakdown: segments.join('-'),
          pronunciation
        };
      } catch (error) {
        console.error(`Error processing word "${cleanWord}":`, error);
        return {
          word: cleanWord,
          syllableCount: 1,
          segments: [cleanWord],
          syllableBreakdown: cleanWord
        };
      }
    });
    
    const processedResults = await Promise.all(promises);
    results.push(...processedResults);
    
    console.log(`✅ Processed ${results.length} words successfully`);
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in get-word-syllables:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
