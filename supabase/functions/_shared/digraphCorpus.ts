// Digraph Corpus v2 - Fixed dataset for Pre-K through Grade 2
// Import directly into edge functions for 0ms latency lookups
// Includes both digraphs (two letters, one sound) and consonant blends

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
    corpus_version: "v2",
    grade_ceiling: "GRADE_2",
    scope: "English digraph and consonant blend words commonly encountered from Pre-K through Grade 2",
    rules: [
      "No proper nouns",
      "No post–Grade 2 vocabulary",
      "One canonical spelling per word",
      "Words grouped by spelling digraph/blend, not pronunciation",
      "Grades use enum constants only",
      "Includes traditional digraphs and consonant blends matching UI options"
    ]
  },
  grades: ["PRE_K", "K", "GRADE_1", "GRADE_2"],
  digraphs: [
    // ===== CONSONANT DIGRAPHS =====
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
      digraph: "ph",
      words: [
        { word: "phone", grade: "K" },
        { word: "photo", grade: "K" },
        { word: "phrase", grade: "GRADE_1" },
        { word: "elephant", grade: "GRADE_1" },
        { word: "dolphin", grade: "GRADE_1" },
        { word: "alphabet", grade: "GRADE_2" },
        { word: "trophy", grade: "GRADE_2" },
        { word: "graph", grade: "GRADE_2" },
        { word: "phonics", grade: "GRADE_2" },
        { word: "pharmacy", grade: "GRADE_2" }
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
      digraph: "gh",
      words: [
        { word: "ghost", grade: "K" },
        { word: "night", grade: "K" },
        { word: "light", grade: "K" },
        { word: "right", grade: "GRADE_1" },
        { word: "sight", grade: "GRADE_1" },
        { word: "fight", grade: "GRADE_1" },
        { word: "bright", grade: "GRADE_1" },
        { word: "flight", grade: "GRADE_2" },
        { word: "knight", grade: "GRADE_2" },
        { word: "thought", grade: "GRADE_2" },
        { word: "daughter", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "kn",
      words: [
        { word: "knee", grade: "K" },
        { word: "knot", grade: "K" },
        { word: "know", grade: "K" },
        { word: "knew", grade: "GRADE_1" },
        { word: "knife", grade: "GRADE_1" },
        { word: "knock", grade: "GRADE_1" },
        { word: "knight", grade: "GRADE_2" },
        { word: "knit", grade: "GRADE_2" },
        { word: "knob", grade: "GRADE_2" },
        { word: "knowledge", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "wr",
      words: [
        { word: "wrap", grade: "K" },
        { word: "write", grade: "K" },
        { word: "wrist", grade: "GRADE_1" },
        { word: "wrong", grade: "GRADE_1" },
        { word: "wrote", grade: "GRADE_1" },
        { word: "wreck", grade: "GRADE_2" },
        { word: "wreath", grade: "GRADE_2" },
        { word: "wrestle", grade: "GRADE_2" },
        { word: "wrapper", grade: "GRADE_2" },
        { word: "wriggle", grade: "GRADE_2" }
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
        { word: "quilt", grade: "GRADE_1" },
        { word: "question", grade: "GRADE_2" },
        { word: "quarter", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "tch",
      words: [
        { word: "itch", grade: "K" },
        { word: "catch", grade: "K" },
        { word: "match", grade: "K" },
        { word: "watch", grade: "GRADE_1" },
        { word: "patch", grade: "GRADE_1" },
        { word: "hatch", grade: "GRADE_1" },
        { word: "switch", grade: "GRADE_1" },
        { word: "stretch", grade: "GRADE_2" },
        { word: "scratch", grade: "GRADE_2" },
        { word: "kitchen", grade: "GRADE_2" },
        { word: "catcher", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "dge",
      words: [
        { word: "edge", grade: "K" },
        { word: "badge", grade: "GRADE_1" },
        { word: "bridge", grade: "GRADE_1" },
        { word: "fridge", grade: "GRADE_1" },
        { word: "judge", grade: "GRADE_1" },
        { word: "ridge", grade: "GRADE_2" },
        { word: "wedge", grade: "GRADE_2" },
        { word: "hedge", grade: "GRADE_2" },
        { word: "ledge", grade: "GRADE_2" },
        { word: "knowledge", grade: "GRADE_2" }
      ]
    },

    // ===== CONSONANT BLENDS =====
    {
      digraph: "sc",
      words: [
        { word: "scat", grade: "PRE_K" },
        { word: "scan", grade: "K" },
        { word: "scar", grade: "K" },
        { word: "scale", grade: "GRADE_1" },
        { word: "scare", grade: "GRADE_1" },
        { word: "scene", grade: "GRADE_1" },
        { word: "scent", grade: "GRADE_1" },
        { word: "score", grade: "GRADE_2" },
        { word: "scooter", grade: "GRADE_2" },
        { word: "scissors", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "sk",
      words: [
        { word: "ski", grade: "PRE_K" },
        { word: "sky", grade: "PRE_K" },
        { word: "skip", grade: "K" },
        { word: "skin", grade: "K" },
        { word: "skate", grade: "GRADE_1" },
        { word: "skill", grade: "GRADE_1" },
        { word: "skirt", grade: "GRADE_1" },
        { word: "skull", grade: "GRADE_2" },
        { word: "skeleton", grade: "GRADE_2" },
        { word: "skateboard", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "sm",
      words: [
        { word: "small", grade: "PRE_K" },
        { word: "smell", grade: "K" },
        { word: "smile", grade: "K" },
        { word: "smart", grade: "GRADE_1" },
        { word: "smoke", grade: "GRADE_1" },
        { word: "smooth", grade: "GRADE_1" },
        { word: "smash", grade: "GRADE_2" },
        { word: "smother", grade: "GRADE_2" },
        { word: "smuggle", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "sn",
      words: [
        { word: "snow", grade: "PRE_K" },
        { word: "snap", grade: "K" },
        { word: "snack", grade: "K" },
        { word: "snake", grade: "K" },
        { word: "snail", grade: "GRADE_1" },
        { word: "snore", grade: "GRADE_1" },
        { word: "sneeze", grade: "GRADE_1" },
        { word: "snuggle", grade: "GRADE_2" },
        { word: "snowflake", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "sp",
      words: [
        { word: "spin", grade: "PRE_K" },
        { word: "spot", grade: "PRE_K" },
        { word: "spoon", grade: "K" },
        { word: "speak", grade: "K" },
        { word: "spell", grade: "GRADE_1" },
        { word: "spend", grade: "GRADE_1" },
        { word: "spider", grade: "GRADE_1" },
        { word: "special", grade: "GRADE_2" },
        { word: "sparkle", grade: "GRADE_2" },
        { word: "spaghetti", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "st",
      words: [
        { word: "star", grade: "PRE_K" },
        { word: "stop", grade: "PRE_K" },
        { word: "step", grade: "K" },
        { word: "stay", grade: "K" },
        { word: "story", grade: "GRADE_1" },
        { word: "stand", grade: "GRADE_1" },
        { word: "storm", grade: "GRADE_1" },
        { word: "street", grade: "GRADE_2" },
        { word: "station", grade: "GRADE_2" },
        { word: "stomach", grade: "GRADE_2" }
      ]
    },
    {
      digraph: "sw",
      words: [
        { word: "swim", grade: "PRE_K" },
        { word: "swan", grade: "K" },
        { word: "swap", grade: "K" },
        { word: "swing", grade: "K" },
        { word: "sweet", grade: "GRADE_1" },
        { word: "sweep", grade: "GRADE_1" },
        { word: "sweat", grade: "GRADE_1" },
        { word: "switch", grade: "GRADE_2" },
        { word: "swallow", grade: "GRADE_2" },
        { word: "sweater", grade: "GRADE_2" }
      ]
    }
  ]
};

// Helper functions for fast lookups

/**
 * Get all words for a specific digraph
 */
export function getWordsForDigraph(digraph: string): WordEntry[] {
  const entry = DIGRAPH_CORPUS.digraphs.find(d => d.digraph.toLowerCase() === digraph.toLowerCase());
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
  return DIGRAPH_CORPUS.digraphs.find(d => d.digraph.toLowerCase() === digraph.toLowerCase());
}

/**
 * Get words for a digraph filtered up to a maximum grade level
 */
export function getWordsForDigraphThroughGrade(digraph: string, maxGrade: GradeLevel): WordEntry[] {
  const gradeOrder: GradeLevel[] = ['PRE_K', 'K', 'GRADE_1', 'GRADE_2'];
  const maxIndex = gradeOrder.indexOf(maxGrade);
  const validGrades = gradeOrder.slice(0, maxIndex + 1);
  
  const entry = DIGRAPH_CORPUS.digraphs.find(d => d.digraph.toLowerCase() === digraph.toLowerCase());
  if (!entry) return [];
  
  return entry.words.filter(w => validGrades.includes(w.grade));
}

/**
 * Check if a digraph exists in the corpus
 */
export function isValidDigraph(digraph: string): boolean {
  return DIGRAPH_CORPUS.digraphs.some(d => d.digraph.toLowerCase() === digraph.toLowerCase());
}

/**
 * Get total word count for a digraph
 */
export function getWordCountForDigraph(digraph: string): number {
  const entry = DIGRAPH_CORPUS.digraphs.find(d => d.digraph.toLowerCase() === digraph.toLowerCase());
  return entry ? entry.words.length : 0;
}
