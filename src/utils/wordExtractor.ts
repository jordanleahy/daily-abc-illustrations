import { ExtractedWord } from "@/types/wordAssessment";

/**
 * Extract individual words from text, preserving original casing
 * Returns array of word objects with text and index
 */
export function extractWords(text: string): ExtractedWord[] {
  if (!text || text.trim().length === 0) return [];
  
  // Split on whitespace, preserve original casing
  const words = text
    .split(/\s+/)
    .filter(w => w.trim().length > 0)
    .map((word, index) => ({
      word: word.trim(),
      index
    }));
  
  return words;
}
