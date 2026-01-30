
# Plan: Unify Prompt Sanitization at Storage Time

## Overview
Consolidate prompt cleaning by sanitizing at the **extraction point** (`pageHelpers.ts`) instead of having duplicate cleaning logic in both the client (`stripTitleFromPrompt`) and server (`sanitizeImagePrompt`). This ensures what users see in chat is identical to what the "Generate" button sends.

## Current Architecture

```text
Agent Output (raw markdown)
        ↓
parseBookOutline() → extractPromptsRecord()
        ↓
qa_page_prompts (RAW stored - contains **Text Overlay:**, metadata, etc.)
        ↓
┌───────────────────────────────────────────────────────────────┐
│                                                               │
▼                           ▼                                   ▼
Display in Chat         Copy Prompt                         Generate
(shows raw)         (stripTitleFromPrompt)          (sanitizeImagePrompt + enhancements)
                            ↓                                   ↓
                    Clean prompt                  Clean prompt + aspect ratio + negative prompt
```

**Problems:**
- Two separate cleaning functions with overlapping logic (~80 lines each)
- Prompts shown to users differ from what Generate sends
- Maintenance burden of keeping both in sync
- Users see confusing instructional metadata like `**Text Overlay:**`

## Proposed Architecture

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

## Implementation Steps

### Step 1: Create Shared Sanitization Utility
Create `src/utils/promptSanitizer.ts` with a unified function combining logic from both existing cleaners:

**What gets removed:**
- `**Page N: Title**` headers
- `**Text Overlay:**` sections
- `**Rhyme Text:**` and `**Rhyme Pair:**` sections
- `- Text Overlay:` bullet lines
- `- Opposite Pair:` bullet lines
- Character metadata sections
- `**Educational Content:**` and `**Activity:**` sections
- `DISPLAY TITLE:` instructions
- JSON metadata prefixes
- Standalone quoted text lines

**What stays server-side only:**
- Aspect ratio prefix (depends on page type)
- Cover title instruction (depends on book title)
- Opposites split-screen rules (depends on book category)
- Negative prompt appendix (always added)

### Step 2: Update pageHelpers.ts
Apply sanitizer in `extractPromptsRecord()` at extraction time:

```typescript
import { sanitizeImagePrompt } from './promptSanitizer';

export const extractPromptsRecord = (outline: ParsedOutline | null): Record<number, string> => {
  if (!outline) return {};
  
  const prompts: Record<number, string> = {};
  outline.allPages.forEach((page, pageNum) => {
    if (page.description) {
      // Sanitize at extraction - prompts stored clean
      prompts[pageNum] = sanitizeImagePrompt(page.description);
    }
  });
  
  return prompts;
};
```

### Step 3: Simplify BookEditorPanel.tsx
Remove `stripTitleFromPrompt()` function (~30 lines) - prompts are already clean:

```typescript
// BEFORE:
const cleanPrompt = stripTitleFromPrompt(prompt);
await copyToClipboard(cleanPrompt);

// AFTER:
await copyToClipboard(prompt); // Already sanitized at storage
```

### Step 4: Simplify generate-color-image Edge Function
Remove `sanitizeImagePrompt()` function body, keep only contextual enhancements:

```typescript
// BEFORE:
const sanitizedPrompt = sanitizeImagePrompt(prompt);
const enhancedPrompt = aspectRatioPrefix + coverTitlePrefix + sanitizedPrompt + oppositesSuffix;

// AFTER:
// Prompt arrives pre-sanitized, just add contextual enhancements
const enhancedPrompt = aspectRatioPrefix + coverTitlePrefix + prompt + oppositesSuffix + negativePromptSuffix;
```

Keep the negative prompt appendix as a safety net.

### Step 5: Add Fallback for Legacy Data
Existing `qa_page_prompts` may contain unsanitized prompts. Add fallback sanitization in `getCurrentPagePrompt()`:

```typescript
const getCurrentPagePrompt = useCallback((pageNum: number): string | null => {
  if (editorPagePrompts[pageNum]) {
    // Apply sanitization for any legacy unsanitized prompts
    return sanitizeImagePrompt(editorPagePrompts[pageNum]);
  }
  // ... rest of function
}, [...]);
```

---

## Technical Details

### Shared Sanitizer Function

```typescript
// src/utils/promptSanitizer.ts

export function sanitizeImagePrompt(prompt: string): string {
  if (!prompt) return '';
  
  let clean = prompt;
  
  // Remove page headers: **Page N: Title** or **Cover: Title**
  clean = clean.replace(/^\*\*(?:Page\s+\d+|Cover|Educational Focus):[^\n*]*\*\*\s*/gim, '');
  
  // Remove **Text Overlay:** sections
  clean = clean.replace(/\*\*Text Overlay:\*\*[\s\S]*?(?=\*\*[A-Z]|$)/gi, '');
  
  // Remove **Rhyme Text:** and **Rhyme Pair:** sections
  clean = clean.replace(/\*\*Rhyme (?:Text|Pair):\*\*[\s\S]*?(?=\*\*[A-Z]|$)/gi, '');
  
  // Remove bullet-format instruction lines
  clean = clean.replace(/^-\s*\*{0,2}(?:Text Overlay|Opposite Pair)\*{0,2}:\s*[^\n]*\n?/gim, '');
  
  // Remove character metadata sections
  clean = clean.replace(/\*\*(?:Paw Patrol |Disney |Bluey |)Character\(?s?\)?:\*\*[^\n]*\n?/gi, '');
  
  // Remove **Educational Content:** and **Activity:** sections
  clean = clean.replace(/\*\*(?:Educational Content|Activity):\*\*[\s\S]*?(?=\n\*\*|$)/gi, '');
  
  // Remove **Image Prompt:** label but keep content
  clean = clean.replace(/\*\*(?:Illustration|Image Prompt):\*\*\s*/gi, '');
  
  // Remove DISPLAY TITLE instructions
  clean = clean.replace(/\n*DISPLAY TITLE:[\s\S]*$/gi, '');
  
  // Remove JSON metadata prefix
  clean = clean.replace(/^\[pageType:\s*"[^"]*",\s*pageNumber:\s*\d+\]\s*/gi, '');
  
  // Remove standalone quoted text lines (rhymes)
  clean = clean.replace(/^[""][^""]+[""]\.?\s*$/gm, '');
  
  // Clean up bullet points and whitespace
  clean = clean.replace(/^[-*]\s+/gm, '');
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();
  
  return clean;
}
```

### Edge Function Contextual Enhancements

The server will still add page/book-specific elements:

```typescript
// These depend on runtime data and must stay server-side
const aspectRatioPrefix = requiresSquareFormat ? `${COVER_ASPECT_RATIOS.square}\n\n` : '';
const coverTitlePrefix = isCoverPage && bookTitle ? `CRITICAL - BOOK COVER...` : '';
const oppositesSuffix = isOppositesContentPage ? OPPOSITES_SPLIT_SCREEN_RULES : '';
const negativePrompt = '\n\nNo text overlays. DO NOT add any text...';

// Prompt arrives pre-sanitized, just enhance it
const enhancedPrompt = aspectRatioPrefix + coverTitlePrefix + prompt + oppositesSuffix + negativePrompt;
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/utils/promptSanitizer.ts` | **NEW** - Shared sanitization utility (~50 lines) |
| `src/utils/pageHelpers.ts` | Apply sanitizer in `extractPromptsRecord()` |
| `src/pages/GoogleChat.tsx` | Apply sanitizer in `getCurrentPagePrompt()` fallback |
| `src/components/chat/BookEditorPanel.tsx` | Remove `stripTitleFromPrompt()` (~30 lines removed) |
| `supabase/functions/generate-color-image/index.ts` | Remove `sanitizeImagePrompt()` body (~40 lines), keep contextual logic |
| `src/hooks/useGoogleCreateBook.ts` | Apply sanitizer in fallback extraction |

## Benefits

1. **Single source of truth** - One sanitization function, consistent behavior everywhere
2. **What you see = what you get** - Chat displays exactly what will be generated
3. **Code reduction** - Remove ~100 lines of duplicate logic
4. **Easier maintenance** - Changes to sanitization rules apply globally
5. **Better UX** - Users see clean, readable scene descriptions instead of confusing metadata

## Risk Mitigation

1. **Backward compatibility**: Fallback sanitization in `getCurrentPagePrompt()` handles legacy unsanitized prompts
2. **Defense in depth**: Keep negative prompt appendix on server as safety net
3. **No data migration**: Existing prompts sanitized on read, not in database
4. **Testing**: Verify with existing books that image generation still works correctly

## Estimated Impact

- **Code reduction**: ~100-120 lines removed
- **Files touched**: 6 files
- **Risk level**: Low-Medium (sanitization logic is well-understood)
- **Testing required**: Manual verification of prompt display and image generation
