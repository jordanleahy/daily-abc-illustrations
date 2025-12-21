import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  
  // Find vowel groups
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
      splitPoints.push(currentEnd + 1);
    } else if (numConsonants === 1) {
      splitPoints.push(currentEnd + 1);
    } else if (numConsonants === 2) {
      const pair = consonants;
      
      if (pair[0] === pair[1]) {
        splitPoints.push(currentEnd + 2);
      } else if (DIGRAPHS.includes(pair.toLowerCase())) {
        splitPoints.push(currentEnd + 1);
      } else if (BLENDS.includes(pair.toLowerCase())) {
        splitPoints.push(currentEnd + 1);
      } else {
        splitPoints.push(currentEnd + 2);
      }
    } else {
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
  
  return adjustToTarget(segments, syllableCount);
}

function adjustToTarget(segments: string[], target: number): string[] {
  if (segments.length === target) {
    return segments;
  }
  
  const result = [...segments];
  
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

// Basic syllable count estimation (fallback)
function estimateSyllableCount(word: string): number {
  if (!word || word.length === 0) return 0;
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return 0;
  
  let count = 0;
  let prevVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const isV = VOWELS.includes(cleanWord[i]);
    if (isV && !prevVowel) count++;
    prevVowel = isV;
  }
  
  if (cleanWord.endsWith('e') && count > 1) count--;
  if (cleanWord.endsWith('le') && cleanWord.length > 2 && !VOWELS.includes(cleanWord[cleanWord.length - 3])) count++;
  
  return Math.max(1, count);
}

function parseLetters(word: string) {
  return word.split('').map((char, index) => ({
    letter: char,
    position: index,
    isVowel: VOWELS.includes(char.toLowerCase()),
    isConsonant: /^[a-z]$/i.test(char) && !VOWELS.includes(char.toLowerCase())
  }));
}

function detectPartOfSpeech(word: string): string {
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

interface DatamuseWord {
  word: string;
  numSyllables?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all pages with titles
    const { data: pages, error: fetchError } = await supabase
      .from('pages')
      .select('id, title, content, book_id')
      .not('title', 'is', null);

    if (fetchError) throw fetchError;

    console.log(`📚 Processing ${pages?.length || 0} pages for word metadata regeneration`);

    let updatedCount = 0;
    let errorCount = 0;

    // Process pages in batches
    const BATCH_SIZE = 10;
    
    for (let batchStart = 0; batchStart < (pages?.length || 0); batchStart += BATCH_SIZE) {
      const batch = pages!.slice(batchStart, batchStart + BATCH_SIZE);
      
      await Promise.all(batch.map(async (page) => {
        try {
          const title = page.title;
          if (!title || title.trim().length === 0) return;

          const words = title.split(/\s+/).filter((word: string) => word.length > 0);
          const cleanWords = words.map((w: string) => w.replace(/[.,!?;:'"]/g, '').toLowerCase()).filter((w: string) => w.length > 0);
          
          // Fetch syllable counts from Datamuse for unique words
          const uniqueWords = [...new Set(cleanWords)];
          const syllableMap = new Map<string, number>();
          
          await Promise.all(uniqueWords.map(async (word: string) => {
            try {
              const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&qe=sp&md=s&max=1`;
              const response = await fetch(url);
              if (response.ok) {
                const data: DatamuseWord[] = await response.json();
                if (data.length > 0 && data[0].numSyllables) {
                  syllableMap.set(word, data[0].numSyllables);
                }
              }
            } catch (e) {
              // Silent fail, use fallback
            }
          }));
          
          const wordMetadata = words.map((word: string, index: number) => {
            const cleanWord = word.replace(/[.,!?;:'"]/g, '');
            const lowerWord = cleanWord.toLowerCase();
            
            const syllableCount = syllableMap.get(lowerWord) ?? estimateSyllableCount(cleanWord);
            const segments = segmentWithCount(cleanWord, syllableCount);
            
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

          const baseContent = (page.content && typeof page.content === 'object') ? page.content : {};
          const updatedContent = { ...baseContent, words: wordMetadata };

          const { error: updateError } = await supabase
            .from('pages')
            .update({ content: updatedContent, updated_at: new Date().toISOString() })
            .eq('id', page.id);

          if (updateError) {
            console.error(`Error updating page ${page.id}:`, updateError);
            errorCount++;
          } else {
            updatedCount++;
          }
        } catch (pageError) {
          console.error(`Error processing page ${page.id}:`, pageError);
          errorCount++;
        }
      }));
      
      console.log(`📦 Processed batch ${Math.floor(batchStart / BATCH_SIZE) + 1}, total updated: ${updatedCount}`);
    }

    console.log(`✅ Regenerated word metadata: ${updatedCount} pages updated, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      totalPages: pages?.length || 0,
      updatedCount,
      errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in regenerate-word-metadata:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
