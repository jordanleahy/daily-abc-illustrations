/**
 * educationalFocus — shared source of truth for the page-2 "Educational Focus"
 * card (age/grade line, learning type, skill focus).
 *
 * Previously this wording lived only inside the *image* prompt
 * (`promptTemplates.ts`), so when text overlays were disabled the badges were
 * rendered as empty colored shapes and the page record carried no text at all.
 * Both the image prompt and the page text now compose from these helpers so
 * they can never drift.
 */

export interface EducationalFocusContext {
  bookType?: string | null;
  category?: string | null;
  gradeLevel?: string | null;
  targetAge?: string | null;
  /** Number of content pages (pages after cover + focus page). */
  contentPageCount?: number;
}

export interface EducationalFocusContent {
  /** Age / grade line, e.g. "Pre-K (Ages 3-4)" */
  mainConcept: string;
  /** Learning type line, e.g. "PHONICS | EARLY LITERACY" */
  funFact: string;
  /** Skill / scope line, e.g. "FOCUS: OPPOSITES · 10 pages to explore together" */
  activity: string;
}

const GRADE_LABELS: Record<string, string> = {
  PRE_K: 'Pre-K (Ages 3-4)',
  K: 'Kindergarten (Ages 5-6)',
  GRADE_1: '1st Grade (Ages 6-7)',
  GRADE_2: '2nd Grade (Ages 7-8)',
};

/**
 * Display text for the age/grade line. Prefers gradeLevel, falls back to the
 * legacy targetAge string, then to a safe default.
 */
export function getGradeDisplayText(gradeLevel?: string | null, targetAge?: string | null): string {
  if (gradeLevel) {
    return GRADE_LABELS[gradeLevel] || gradeLevel;
  }

  if (targetAge) {
    if (targetAge.toLowerCase().includes('age')) return targetAge;
    if (targetAge.includes('-')) return `Ages ${targetAge}`;
    return targetAge;
  }

  return 'Ages 3-5';
}

const LEARNING_DETAILS: Record<string, { learningType: string; specificSkill: string }> = {
  abc: { learningType: 'PHONICS | EARLY LITERACY', specificSkill: 'FOCUS: LOWERCASE A-Z' },
  alphabet: { learningType: 'PHONICS | EARLY LITERACY', specificSkill: 'FOCUS: LETTER RECOGNITION' },
  numbers: { learningType: 'MATH | COUNTING', specificSkill: 'FOCUS: NUMBERS 1-10' },
  shapes: { learningType: 'GEOMETRY | VISUAL', specificSkill: 'FOCUS: BASIC SHAPES' },
  colors: { learningType: 'VISUAL | RECOGNITION', specificSkill: 'FOCUS: COLOR LEARNING' },
  animals: { learningType: 'NATURE | SCIENCE', specificSkill: 'FOCUS: ANIMAL DISCOVERY' },
  emotions: { learningType: 'SOCIAL | EMOTIONAL', specificSkill: 'FOCUS: FEELINGS' },
  'sight-words': { learningType: 'READING | LITERACY', specificSkill: 'FOCUS: SIGHT WORDS' },
  story: { learningType: 'READING | COMPREHENSION', specificSkill: 'FOCUS: STORYTELLING' },
  opposites: { learningType: 'VOCABULARY | CONTRASTS', specificSkill: 'FOCUS: OPPOSITE PAIRS' },
  rhyming: { learningType: 'PHONOLOGICAL AWARENESS', specificSkill: 'FOCUS: RHYMING WORDS' },
  digraphs: { learningType: 'PHONICS | DECODING', specificSkill: 'FOCUS: LETTER SOUNDS' },
  cvc: { learningType: 'PHONICS | BLENDING', specificSkill: 'FOCUS: CVC WORDS' },
  'first-words': { learningType: 'VOCABULARY | EARLY LITERACY', specificSkill: 'FOCUS: FIRST WORDS' },
  manners: { learningType: 'SOCIAL | EMOTIONAL', specificSkill: 'FOCUS: EVERYDAY MANNERS' },
  bedtime: { learningType: 'ROUTINES | CALM', specificSkill: 'FOCUS: BEDTIME WIND-DOWN' },
  'dr-seuss': { learningType: 'READING | PLAYFUL RHYME', specificSkill: 'FOCUS: WORD PLAY' },
  song: { learningType: 'MUSIC | LANGUAGE', specificSkill: 'FOCUS: SONGS & VERSES' },
  general: { learningType: 'EARLY LEARNING | DISCOVERY', specificSkill: 'FOCUS: EVERYDAY LEARNING' },
  'parent-education': { learningType: 'FOR GROWN-UPS | GUIDANCE', specificSkill: 'FOCUS: READING TOGETHER' },

};

export function getLearningDetails(bookType?: string | null): { learningType: string; specificSkill: string } {
  const key = (bookType || '').toLowerCase().trim();
  return (
    LEARNING_DETAILS[key] || {
      learningType: 'EARLY LEARNING',
      specificSkill: 'FOCUS: EDUCATIONAL',
    }
  );
}

/**
 * Composes the three text lines shown on the Educational Focus page.
 * Pure and deterministic — no AI, no network.
 */
export function buildEducationalFocusContent(ctx: EducationalFocusContext): EducationalFocusContent {
  const details = getLearningDetails(ctx.bookType || ctx.category);
  const ageLine = getGradeDisplayText(ctx.gradeLevel, ctx.targetAge);

  const count = typeof ctx.contentPageCount === 'number' && ctx.contentPageCount > 0
    ? ctx.contentPageCount
    : undefined;

  const activity = count
    ? `${details.specificSkill} · ${count} pages to explore together`
    : details.specificSkill;

  return {
    mainConcept: ageLine,
    funFact: details.learningType,
    activity,
  };
}

/**
 * Single-line overlay caption for the focus page (rendered over the badge art).
 */
export function buildEducationalFocusOverlayText(ctx: EducationalFocusContext): string {
  const { mainConcept, funFact } = buildEducationalFocusContent(ctx);
  return `${mainConcept} · ${funFact}`;
}
