import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Syllable counting using vowel groups (matches 'syllable' npm package logic)
const VOWELS = ['a', 'e', 'i', 'o', 'u'];

function getSyllableCount(word: string): number {
  if (!word || word.length === 0) return 0;
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return 0;
  
  let count = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = VOWELS.includes(cleanWord[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Silent 'e' at end
  if (cleanWord.endsWith('e') && count > 1 && !cleanWord.endsWith('le')) {
    count--;
  }
  
  // Handle -le endings (they form their own syllable)
  if (cleanWord.length > 2 && cleanWord.endsWith('le') && !VOWELS.includes(cleanWord[cleanWord.length - 3])) {
    // Already counted, no adjustment needed
  }
  
  return Math.max(1, count);
}

// Consonant patterns
const CONSONANT_DIGRAPHS = ['ch', 'sh', 'th', 'wh', 'ph', 'gh', 'ck', 'ng', 'qu'];
const INITIAL_BLENDS = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'scr', 'spl', 'spr', 'str', 'thr'];

function isDigraph(str: string): boolean {
  return CONSONANT_DIGRAPHS.includes(str.toLowerCase());
}

function isInitialBlend(str: string): boolean {
  return INITIAL_BLENDS.includes(str.toLowerCase());
}

function findVowelPositions(word: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (VOWELS.includes(word[i])) {
      positions.push(i);
    }
  }
  return positions;
}

function segmentIntoSyllables(word: string, targetCount?: number): string[] {
  if (!word || word.length === 0) return [];
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return [word];
  
  const syllableCount = targetCount ?? getSyllableCount(cleanWord);
  
  if (syllableCount === 1) {
    return [cleanWord];
  }
  
  const vowelPositions = findVowelPositions(cleanWord);
  
  if (vowelPositions.length === 0) {
    return [cleanWord];
  }
  
  // Merge consecutive vowels
  const vowelGroups: { start: number; end: number }[] = [];
  let currentGroup = { start: vowelPositions[0], end: vowelPositions[0] };
  
  for (let i = 1; i < vowelPositions.length; i++) {
    if (vowelPositions[i] === currentGroup.end + 1) {
      currentGroup.end = vowelPositions[i];
    } else {
      vowelGroups.push({ ...currentGroup });
      currentGroup = { start: vowelPositions[i], end: vowelPositions[i] };
    }
  }
  vowelGroups.push(currentGroup);
  
  if (vowelGroups.length < syllableCount) {
    return splitEvenly(cleanWord, syllableCount);
  }
  
  const splitPoints: number[] = [];
  
  for (let i = 0; i < vowelGroups.length - 1; i++) {
    const currentEnd = vowelGroups[i].end;
    const nextStart = vowelGroups[i + 1].start;
    const consonantsBetween = nextStart - currentEnd - 1;
    
    if (consonantsBetween === 0) {
      splitPoints.push(currentEnd + 1);
    } else if (consonantsBetween === 1) {
      splitPoints.push(currentEnd + 1);
    } else if (consonantsBetween === 2) {
      const consonantPair = cleanWord.substring(currentEnd + 1, nextStart);
      if (isDigraph(consonantPair) || isInitialBlend(consonantPair)) {
        splitPoints.push(currentEnd + 1);
      } else {
        splitPoints.push(currentEnd + 2);
      }
    } else {
      const consonants = cleanWord.substring(currentEnd + 1, nextStart);
      let splitAt = currentEnd + 2;
      
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
  
  return adjustSegmentCount(segments, syllableCount);
}

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

function adjustSegmentCount(segments: string[], targetCount: number): string[] {
  const result = [...segments];
  
  if (result.length === targetCount) {
    return result;
  }
  
  if (result.length > targetCount) {
    while (result.length > targetCount) {
      let minIndex = 0;
      let minLength = Infinity;
      
      for (let i = 0; i < result.length - 1; i++) {
        const combined = result[i].length + result[i + 1].length;
        if (combined < minLength) {
          minLength = combined;
          minIndex = i;
        }
      }
      
      result[minIndex] = result[minIndex] + result[minIndex + 1];
      result.splice(minIndex + 1, 1);
    }
  } else {
    while (result.length < targetCount) {
      let maxIndex = 0;
      let maxLength = 0;
      
      for (let i = 0; i < result.length; i++) {
        if (result[i].length > maxLength) {
          maxLength = result[i].length;
          maxIndex = i;
        }
      }
      
      const seg = result[maxIndex];
      if (seg.length < 2) break;
      
      const mid = Math.ceil(seg.length / 2);
      result.splice(maxIndex, 1, seg.substring(0, mid), seg.substring(mid));
    }
  }
  
  return result;
}

function isVowelChar(char: string): boolean {
  return VOWELS.includes(char.toLowerCase());
}

function isConsonant(char: string): boolean {
  return /^[a-z]$/i.test(char) && !isVowelChar(char);
}

function parseLetters(word: string) {
  return word.split('').map((char, index) => ({
    letter: char,
    position: index,
    isVowel: isVowelChar(char),
    isConsonant: isConsonant(char)
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

function parseWordsFromTitle(title: string) {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting syllable backfill migration...');

    // Fetch pages that don't have segments yet (check for missing or empty segments in first word)
    const { data: pages, error: fetchError } = await supabase
      .from('pages')
      .select('id, title, content, book_id')
      .not('title', 'is', null)
      .order('created_at', { ascending: true })
      .limit(500); // Process in smaller batches

    if (fetchError) {
      throw new Error(`Failed to fetch pages: ${fetchError.message}`);
    }

    // Filter to only pages that need processing (no segments in content.words)
    const pagesToProcess = (pages || []).filter(page => {
      if (!page.content || typeof page.content !== 'object') return true;
      const content = page.content as Record<string, unknown>;
      if (!content.words || !Array.isArray(content.words)) return true;
      const words = content.words as Array<{ segments?: string[] }>;
      // Check if first word has segments
      if (words.length === 0) return true;
      return !words[0].segments || words[0].segments.length === 0;
    });

    console.log(`📚 Found ${pagesToProcess.length} pages needing syllable segments`);

    let updated = 0;
    let errors = 0;

    // Process in parallel batches of 50
    const batchSize = 50;
    for (let i = 0; i < pagesToProcess.length; i += batchSize) {
      const batch = pagesToProcess.slice(i, i + batchSize);
      
      const updates = await Promise.all(batch.map(async (page) => {
        try {
          if (!page.title || page.title.trim().length === 0) {
            return { success: true, skipped: true };
          }

          const words = parseWordsFromTitle(page.title);
          const existingContent = (page.content && typeof page.content === 'object') 
            ? page.content 
            : {};
          
          const updatedContent = {
            ...existingContent,
            words
          };

          const { error: updateError } = await supabase
            .from('pages')
            .update({ 
              content: updatedContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', page.id);

          if (updateError) {
            return { success: false, error: updateError.message };
          }
          return { success: true };
        } catch (err) {
          return { success: false, error: String(err) };
        }
      }));

      updates.forEach(result => {
        if (result.success && !result.skipped) updated++;
        if (!result.success) errors++;
      });

      console.log(`📊 Progress: ${Math.min(i + batchSize, pagesToProcess.length)}/${pagesToProcess.length} pages, ${updated} updated`);
    }

    const result = {
      success: true,
      totalChecked: pages?.length || 0,
      neededProcessing: pagesToProcess.length,
      updated,
      errors,
      message: `Backfill complete. Updated ${updated} pages with syllable segments.`
    };

    console.log('✅ Backfill complete:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('❌ Backfill error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});