// Digraph Corpus - Fixed dataset for Pre-K through Grade 2
// Import directly into edge functions for 0ms latency lookups

export type GradeLevel = 'PRE_K' | 'K' | 'GRADE_1' | 'GRADE_2';

export interface WordEntry {
  word: string;
  grade: GradeLevel;
}

export interface DigraphEntry {
  digraph: string;
  words: WordEntry[];
}

export interface DigraphCorpus {
  metadata: {
    corpus_version: string;
    grade_ceiling: string;
    scope: string;
    rules: string[];
  };
  grades: GradeLevel[];
  digraphs: DigraphEntry[];
}

export const DIGRAPH_CORPUS: DigraphCorpus = {
  metadata: {
    corpus_version: "v1",
    grade_ceiling: "GRADE_2",
    scope: "English digraph words commonly encountered from Pre-K through Grade 2",
    rules: [
      "No proper nouns",
      "No post–Grade 2 vocabulary",
      "One canonical spelling per word",
      "Words grouped by spelling digraph, not pronunciation",
      "Grades use enum constants only"
    ]
  },
  grades: ["PRE_K", "K", "GRADE_1", "GRADE_2"],
  digraphs: [
    {
      digraph: "ch",
      words: [
        { word: "chip", grade: "PRE_K" },
        { word: "chop", grade: "PRE_K" },
        { word: "chin", grade: "PRE_K" },
        { word: "chat", grade: "K" },
        { word: "check", grade: "K" },
        { word: "chick", grade: "K" },
        { word: "much", grade: "K" },
        { word: "rich", grade: "K" },
        { word: "chair", grade: "GRADE_1" },
        { word: "cheese", grade: "GRADE_1" },
        { word: "chicken", grade: "GRADE_1" },
        { word: "lunch", grade: "GRADE_1" },
        { word: "bench", grade: "GRADE_1" },
        { word: "children", grade: "GRADE_2" },
        { word: "teacher", grade: "GRADE_2" },
        { word: "kitchen", grade: "GRADE_2" },
        { word: "branch", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "sh",
      words: [
        { word: "ship", grade: "PRE_K" },
        { word: "shop", grade: "PRE_K" },
        { word: "fish", grade: "PRE_K" },
        { word: "wish", grade: "K" },
        { word: "shell", grade: "K" },
        { word: "shoe", grade: "K" },
        { word: "shut", grade: "K" },
        { word: "sheep", grade: "GRADE_1" },
        { word: "shark", grade: "GRADE_1" },
        { word: "brush", grade: "GRADE_1" },
        { word: "shirt", grade: "GRADE_1" },
        { word: "shadow", grade: "GRADE_2" },
        { word: "finish", grade: "GRADE_2" },
        { word: "publish", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "th",
      words: [
        { word: "this", grade: "PRE_K" },
        { word: "that", grade: "PRE_K" },
        { word: "them", grade: "PRE_K" },
        { word: "thin", grade: "K" },
        { word: "then", grade: "K" },
        { word: "three", grade: "K" },
        { word: "with", grade: "K" },
        { word: "think", grade: "GRADE_1" },
        { word: "thank", grade: "GRADE_1" },
        { word: "thing", grade: "GRADE_1" },
        { word: "tooth", grade: "GRADE_1" },
        { word: "mother", grade: "GRADE_2" },
        { word: "father", grade: "GRADE_2" },
        { word: "brother", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "ck",
      words: [
        { word: "duck", grade: "PRE_K" },
        { word: "sock", grade: "PRE_K" },
        { word: "back", grade: "K" },
        { word: "rock", grade: "K" },
        { word: "kick", grade: "K" },
        { word: "pick", grade: "K" },
        { word: "black", grade: "GRADE_1" },
        { word: "snack", grade: "GRADE_1" },
        { word: "truck", grade: "GRADE_1" },
        { word: "clock", grade: "GRADE_1" },
        { word: "bucket", grade: "GRADE_2" },
        { word: "pocket", grade: "GRADE_2" },
        { word: "jacket", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "ng",
      words: [
        { word: "sing", grade: "PRE_K" },
        { word: "ring", grade: "PRE_K" },
        { word: "song", grade: "K" },
        { word: "long", grade: "K" },
        { word: "bang", grade: "K" },
        { word: "bring", grade: "GRADE_1" },
        { word: "thing", grade: "GRADE_1" },
        { word: "young", grade: "GRADE_1" },
        { word: "morning", grade: "GRADE_2" },
        { word: "running", grade: "GRADE_2" },
        { word: "jumping", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "wh",
      words: [
        { word: "when", grade: "PRE_K" },
        { word: "what", grade: "K" },
        { word: "where", grade: "K" },
        { word: "which", grade: "K" },
        { word: "white", grade: "K" },
        { word: "while", grade: "GRADE_1" },
        { word: "wheel", grade: "GRADE_1" },
        { word: "whale", grade: "GRADE_1" },
        { word: "whisper", grade: "GRADE_2" },
        { word: "whether", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "qu",
      words: [
        { word: "queen", grade: "PRE_K" },
        { word: "quick", grade: "K" },
        { word: "quiet", grade: "K" },
        { word: "quit", grade: "K" },
        { word: "quack", grade: "GRADE_1" },
        { word: "quiz", grade: "GRADE_1" },
        { word: "question", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "ai",
      words: [
        { word: "rain", grade: "PRE_K" },
        { word: "tail", grade: "K" },
        { word: "train", grade: "K" },
        { word: "paint", grade: "K" },
        { word: "wait", grade: "K" },
        { word: "brain", grade: "GRADE_1" },
        { word: "chain", grade: "GRADE_1" },
        { word: "plain", grade: "GRADE_1" },
        { word: "afraid", grade: "GRADE_2" },
        { word: "remain", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "oa",
      words: [
        { word: "boat", grade: "PRE_K" },
        { word: "coat", grade: "K" },
        { word: "road", grade: "K" },
        { word: "soap", grade: "K" },
        { word: "goat", grade: "GRADE_1" },
        { word: "toast", grade: "GRADE_1" },
        { word: "floating", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "ee",
      words: [
        { word: "see", grade: "PRE_K" },
        { word: "tree", grade: "K" },
        { word: "feet", grade: "K" },
        { word: "green", grade: "K" },
        { word: "sleep", grade: "GRADE_1" },
        { word: "keep", grade: "GRADE_1" },
        { word: "between", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "oo",
      words: [
        { word: "moon", grade: "PRE_K" },
        { word: "book", grade: "K" },
        { word: "look", grade: "K" },
        { word: "food", grade: "K" },
        { word: "wood", grade: "GRADE_1" },
        { word: "good", grade: "GRADE_1" },
        { word: "school", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "kn",
      words: [
        { word: "knee", grade: "K" },
        { word: "knife", grade: "GRADE_1" },
        { word: "knock", grade: "GRADE_1" },
        { word: "knot", grade: "GRADE_2" }
      ]
    }
  ]
};

// Helper functions for fast lookups

/**
 * Get all words for a specific digraph
 */
export function getWordsForDigraph(digraph: string): WordEntry[] {
  const entry = DIGRAPH_CORPUS.digraphs.find(d => d.digraph === digraph);
  return entry?.words ?? [];
}

/**
 * Get all words for a specific grade level (across all digraphs)
 */
export function getWordsForGrade(grade: GradeLevel): WordEntry[] {
  return DIGRAPH_CORPUS.digraphs.flatMap(d => 
    d.words.filter(w => w.grade === grade)
  );
}

/**
 * Get words filtered by both digraph and grade
 */
export function getWordsByDigraphAndGrade(digraph: string, grade: GradeLevel): WordEntry[] {
  return getWordsForDigraph(digraph).filter(w => w.grade === grade);
}

/**
 * Get all digraphs that have words at a specific grade level
 */
export function getDigraphsForGrade(grade: GradeLevel): string[] {
  return DIGRAPH_CORPUS.digraphs
    .filter(d => d.words.some(w => w.grade === grade))
    .map(d => d.digraph);
}

/**
 * Get words up to and including a grade level (cumulative)
 */
export function getWordsThroughGrade(grade: GradeLevel): WordEntry[] {
  const gradeOrder: GradeLevel[] = ['PRE_K', 'K', 'GRADE_1', 'GRADE_2'];
  const maxIndex = gradeOrder.indexOf(grade);
  const validGrades = gradeOrder.slice(0, maxIndex + 1);
  
  return DIGRAPH_CORPUS.digraphs.flatMap(d => 
    d.words.filter(w => validGrades.includes(w.grade))
  );
}

/**
 * Get all available digraphs
 */
export function getAllDigraphs(): string[] {
  return DIGRAPH_CORPUS.digraphs.map(d => d.digraph);
}

/**
 * Get digraph entry with all metadata
 */
export function getDigraphEntry(digraph: string): DigraphEntry | undefined {
  return DIGRAPH_CORPUS.digraphs.find(d => d.digraph === digraph);
}
