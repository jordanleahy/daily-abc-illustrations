
# Plan: Centralize Cover Page Prompt Utility

## Status: ✅ COMPLETED

## Overview
Created a shared utility for cover page image generation that consolidates the scattered cover prompt logic into a single source of truth. This ensures consistent cover page styling across all agents and edge functions.

## What Was Done

### Phase 1: Created Shared Cover Constants ✅

Created `supabase/functions/_shared/coverPromptConstants.ts` containing:

1. **COVER_TITLE_INSTRUCTION** - The canonical title display instruction
2. **NO_TEXT_INSTRUCTION** - Strong negative prompt for content pages
3. **COVER_ASPECT_RATIOS** - Aspect ratio instructions for different formats
4. **COVER_STYLE_DEFAULTS** - Default styling constants
5. **generateCoverTitleInstruction(bookTitle)** - Function to generate title instruction with variable title
6. **getCoverPromptEnding()** - Returns the cover title instruction
7. **getContentPromptEnding()** - Returns the no-text instruction
8. **buildCoverPromptPrefix(config)** - Builds complete cover prompt prefix
9. **buildCoverPrompt(config)** - Builds full cover prompt from config
10. **getPromptEndingForPage(pageType, pageNumber)** - Determines correct ending

### Phase 2: Standardized Cover Title Instruction ✅

Adopted canonical instruction format:
> **CRITICAL INSTRUCTION: Display the book title "[TITLE]" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Use a playful, bubble-letter font style (rounded, child-friendly). The title must be the most prominent visual element.**

### Phase 3: Refactored Existing Files ✅

**Files updated:**

1. **`supabase/functions/_shared/promptTemplates.ts`**
   - Added import from `coverPromptConstants.ts`
   - Updated `generateCoverPromptLayered()` to use `generateCoverTitleInstruction()`

2. **`supabase/functions/generate-color-image/index.ts`**
   - Added import from `coverPromptConstants.ts`
   - Updated aspect ratio prefix to use `COVER_ASPECT_RATIOS.square`
   - Updated cover title prefix to use `generateCoverTitleInstruction()`

3. **`supabase/functions/generate-thumbnail/index.ts`**
   - Added imports from `coverPromptConstants.ts`
   - Updated prompt to use `generateCoverTitleInstruction()`
   - Updated styling to use `COVER_STYLE_DEFAULTS`

4. **`supabase/functions/_shared/instructionTemplates.ts`**
   - Added import from `coverPromptConstants.ts`
   - Updated `TEMPLATES.coverPage()` to use `COVER_TITLE_INSTRUCTION`

5. **`supabase/functions/google-create-book/agent-prompts.ts`**
   - Added import from `coverPromptConstants.ts`
   - Updated `BASE_BOOK_STRUCTURE` to use `COVER_TITLE_INSTRUCTION`
   - Added documentation noting centralized location

### Phase 4: Cover Format Configuration ✅

Added support for different cover formats:
- **SQUARE** (1:1): Default for book pages
- **LANDSCAPE** (1200x630): For thumbnails/OG images
- **PORTRAIT** (3:4): Future consideration

---

## Benefits Achieved

1. ✅ **Single Source of Truth**: All cover prompt logic in `coverPromptConstants.ts`
2. ✅ **Consistency**: Same title instruction used everywhere
3. ✅ **Maintainability**: Change once, applies everywhere
4. ✅ **Testability**: Easier to unit test isolated utilities
5. ✅ **Documentation**: Centralized place to document cover requirements

## Files Affected
- `supabase/functions/_shared/coverPromptConstants.ts` (new - 145 lines)
- `supabase/functions/_shared/promptTemplates.ts` (modified)
- `supabase/functions/_shared/instructionTemplates.ts` (modified)
- `supabase/functions/generate-color-image/index.ts` (modified)
- `supabase/functions/generate-thumbnail/index.ts` (modified)
- `supabase/functions/google-create-book/agent-prompts.ts` (modified)
