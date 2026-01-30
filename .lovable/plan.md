# Plan: Unify Prompt Sanitization at Storage Time

## Status: ✅ COMPLETED

## Overview
Consolidate prompt cleaning by sanitizing at the **extraction point** (`pageHelpers.ts`) instead of having duplicate cleaning logic in both the client (`stripTitleFromPrompt`) and server (`sanitizeImagePrompt`). This ensures what users see in chat is identical to what the "Generate" button sends.

## Implementation Summary

### Files Modified

| File | Change |
|------|--------|
| `src/utils/promptSanitizer.ts` | **NEW** - Shared sanitization utility (~65 lines) |
| `src/utils/pageHelpers.ts` | Applied sanitizer in `extractPromptsRecord()` |
| `src/pages/GoogleChat.tsx` | Applied sanitizer in `getCurrentPagePrompt()` for all paths |
| `src/components/chat/BookEditorPanel.tsx` | Removed `stripTitleFromPrompt()` (~30 lines removed) |
| `supabase/functions/generate-color-image/index.ts` | Replaced `sanitizeImagePrompt()` with `addNegativePrompt()` (~35 lines simplified) |
| `src/hooks/useGoogleCreateBook.ts` | Applied sanitizer in fallback extraction |

### Architecture (After)

```text
Agent Output (raw markdown)
        ↓
parseBookOutline() → extractPromptsRecord() + sanitizeImagePrompt()
        ↓
qa_page_prompts (CLEAN stored - pure scene descriptions)
        ↓
┌───────────────────────────────────────────────────────────────┐
│                                                               │
▼                           ▼                                   ▼
Display in Chat         Copy Prompt                         Generate
(shows CLEAN)         (direct use)                  (add contextual enhancements only)
```

### What Gets Removed by Sanitizer

- `**Page N: Title**` headers
- `**Text Overlay:**` sections
- `**Rhyme Text:**` and `**Rhyme Pair:**` sections
- `- Text Overlay:` bullet lines
- `- Opposite Pair:` bullet lines
- Character metadata sections
- `**Educational Content:**` and `**Activity:**` sections
- `**Image Prompt:**` labels (content kept)
- `DISPLAY TITLE:` instructions
- JSON metadata prefixes
- Standalone quoted text lines (rhymes)

### What Stays Server-Side Only

- Aspect ratio prefix (depends on page type)
- Cover title instruction (depends on book title)
- Opposites split-screen rules (depends on book category)
- Negative prompt appendix (always added as safety net)

## Benefits Achieved

1. **Single source of truth** - One sanitization function, consistent behavior everywhere
2. **What you see = what you get** - Chat displays exactly what will be generated
3. **Code reduction** - ~100 lines of duplicate logic removed
4. **Easier maintenance** - Changes to sanitization rules apply globally
5. **Better UX** - Users see clean, readable scene descriptions
