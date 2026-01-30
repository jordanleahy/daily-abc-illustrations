
# Plan: Centralize Cover Page Prompt Utility

## Overview
Create a shared utility for cover page image generation that consolidates the scattered cover prompt logic into a single source of truth. This ensures consistent cover page styling across all agents and edge functions.

## Current Problem
Cover page title display instructions are duplicated across 5+ files with inconsistent wording:
- "upper-middle area" vs "at the center"
- "50-60% of visual space" appears in some but not all
- No shared constants or utility functions for cover prompts

## Proposed Solution

### Phase 1: Create Shared Cover Constants

Create a new file `supabase/functions/_shared/coverPromptConstants.ts` containing:

1. **COVER_TITLE_INSTRUCTION** - The canonical title display instruction
2. **COVER_STYLE_DEFAULTS** - Default styling constants
3. **generateCoverTitleInstruction(bookTitle)** - Function to generate title instruction with variable title
4. **getCoverPromptEnding()** - Returns the correct ending for cover prompts (title instruction, not "No text overlays")

```text
┌─────────────────────────────────────────────────────────────────┐
│                 coverPromptConstants.ts (NEW)                   │
├─────────────────────────────────────────────────────────────────┤
│ COVER_TITLE_INSTRUCTION                                         │
│ COVER_STYLE_DEFAULTS                                            │
│ generateCoverTitleInstruction(title: string): string            │
│ getCoverPromptEnding(): string                                  │
│ buildCoverPrompt(config: CoverPromptConfig): string             │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ imports
            ┌─────────────────┼─────────────────┐
            │                 │                 │
┌───────────┴────┐  ┌────────┴────────┐  ┌────┴───────────────┐
│ promptTemplates│  │ generate-color  │  │ instructionTemplates│
│      .ts       │  │   -image        │  │        .ts         │
└────────────────┘  └─────────────────┘  └────────────────────┘
```

### Phase 2: Standardize Cover Title Instruction

Adopt a single, canonical instruction format:

> **CRITICAL INSTRUCTION: Display the book title "[TITLE]" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Use a playful, bubble-letter font style (rounded, child-friendly). The title must be the most prominent visual element.**

### Phase 3: Refactor Existing Files

**Files to update:**

1. **`supabase/functions/_shared/promptTemplates.ts`**
   - Import from `coverPromptConstants.ts`
   - Replace inline title instructions in `generateCoverPrompt()` and `generateCoverPromptLayered()`

2. **`supabase/functions/generate-color-image/index.ts`**
   - Import `generateCoverTitleInstruction()` 
   - Replace the hardcoded `coverTitlePrefix` constant

3. **`supabase/functions/generate-thumbnail/index.ts`**
   - Import shared constants
   - Use `generateCoverTitleInstruction()` for consistency

4. **`supabase/functions/_shared/instructionTemplates.ts`**
   - Import shared constant for the cover page template
   - Replace inline instruction in `TEMPLATES.coverPage()`

5. **`supabase/functions/google-create-book/agent-prompts.ts`**
   - Import and use shared constant for ABC agent cover guidelines

### Phase 4: Add Cover Format Configuration

Add optional configuration for different cover formats:

- **SQUARE** (1:1): Default for book pages
- **LANDSCAPE** (1200x630): For thumbnails/OG images
- **PORTRAIT** (3:4): Future consideration

---

## Technical Details

### New File Structure
```
supabase/functions/_shared/
├── coverPromptConstants.ts  (NEW)
├── promptTemplates.ts       (MODIFIED - import from cover constants)
├── instructionTemplates.ts  (MODIFIED - import from cover constants)
└── ...
```

### Interface Definition
```typescript
interface CoverPromptConfig {
  bookTitle: string;
  characterTheme?: string;
  bookDescription?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  includeTitle?: boolean;  // false for text-overlay-later approach
}
```

### Constant Definitions
```typescript
export const COVER_TITLE_INSTRUCTION = 
  'CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Use a playful, bubble-letter font style (rounded, child-friendly). The title must be the most prominent visual element.';

export const COVER_ASPECT_RATIOS = {
  square: 'Generate a SQUARE image with 1:1 aspect ratio.',
  landscape: 'Generate a landscape image at 1200x630 ratio.',
} as const;
```

---

## Benefits

1. **Single Source of Truth**: All cover prompt logic in one file
2. **Consistency**: Same title instruction used everywhere
3. **Maintainability**: Change once, applies everywhere
4. **Testability**: Easier to unit test isolated utilities
5. **Documentation**: Centralized place to document cover requirements

## Files Affected
- `supabase/functions/_shared/coverPromptConstants.ts` (new)
- `supabase/functions/_shared/promptTemplates.ts` (modify)
- `supabase/functions/_shared/instructionTemplates.ts` (modify)
- `supabase/functions/generate-color-image/index.ts` (modify)
- `supabase/functions/generate-thumbnail/index.ts` (modify)
- `supabase/functions/google-create-book/agent-prompts.ts` (modify)

## Estimated Complexity
Medium - primarily refactoring with no new features, but touches multiple files
