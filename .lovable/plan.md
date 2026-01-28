
# Implementation Plan: Enhanced Sanitization Regex for Bullet-Format Text Instructions

## Problem Statement

The opposites agent uses bullet-format text instructions (`- Text Overlay:`, `- Opposite Pair:`) that bypass the current sanitization regex patterns, causing text to appear on content page images.

## Current Sanitization (Lines 23-53)

The existing `sanitizeImagePrompt` function handles:
- `**Text Overlay:**` (bold format)
- `**Rhyme Text:**` (bold format)  
- `**Rhyme Pair:**` (bold format)
- Quoted standalone text lines
- `**Illustration:**` / `**Image Prompt:**` labels

**Gap**: It does NOT handle bullet-format patterns used by the opposites agent:
- `- Text Overlay: "Shelly is hot! Now cold!"`
- `- Opposite Pair: Hot / Cold`
- `- Scene Description:` (content that should stay but labels removed)

## Solution

Add new regex patterns to `sanitizeImagePrompt` function to strip bullet-format text overlay instructions.

---

## Implementation Details

### File to Modify
`supabase/functions/generate-color-image/index.ts`

### Changes to `sanitizeImagePrompt` Function

Add the following regex patterns after line 33 (after the existing `**Rhyme Pair:**` removal):

```typescript
// Remove bullet-format Text Overlay lines (entire line including quoted content)
clean = clean.replace(/^-\s*\*{0,2}Text Overlay\*{0,2}:\s*[^\n]*\n?/gim, '');

// Remove bullet-format Opposite Pair lines (entire line)
clean = clean.replace(/^-\s*\*{0,2}Opposite Pair\*{0,2}:\s*[^\n]*\n?/gim, '');

// Remove any remaining "Text Overlay" references regardless of format
clean = clean.replace(/\bText Overlay\b[:\s]*["'][^"']*["']/gi, '');
```

### Pattern Breakdown

| Pattern | Matches | Example |
|---------|---------|---------|
| `^-\s*\*{0,2}Text Overlay\*{0,2}:` | Bullet with optional bold | `- Text Overlay:`, `- **Text Overlay:**` |
| `^-\s*\*{0,2}Opposite Pair\*{0,2}:` | Bullet with optional bold | `- Opposite Pair: Hot / Cold` |
| `\bText Overlay\b[:\s]*["'][^"']*["']` | Any remaining text overlay with quotes | `Text Overlay: "..."` |

### Updated Function (Full)

```typescript
function sanitizeImagePrompt(prompt: string): string {
  let clean = prompt;
  
  // Remove **Text Overlay:** section and its content (until next ** or end)
  clean = clean.replace(/\*\*Text Overlay:\*\*[\s\S]*?(?=\*\*[A-Z]|$)/gi, '');
  
  // Remove **Rhyme Text:** section and its content
  clean = clean.replace(/\*\*Rhyme Text:\*\*[\s\S]*?(?=\*\*[A-Z]|$)/gi, '');
  
  // Remove **Rhyme Pair:** lines
  clean = clean.replace(/\*\*Rhyme Pair:\*\*[^\n]*\n?/gi, '');
  
  // NEW: Remove bullet-format Text Overlay lines (entire line including quoted content)
  clean = clean.replace(/^-\s*\*{0,2}Text Overlay\*{0,2}:\s*[^\n]*\n?/gim, '');
  
  // NEW: Remove bullet-format Opposite Pair lines (entire line)
  clean = clean.replace(/^-\s*\*{0,2}Opposite Pair\*{0,2}:\s*[^\n]*\n?/gim, '');
  
  // NEW: Remove any remaining "Text Overlay" references with quoted content
  clean = clean.replace(/\bText Overlay\b[:\s]*["'][^"']*["']/gi, '');
  
  // Remove standalone quoted text lines (rhymes in quotes)
  clean = clean.replace(/^[""][^""]+[""]\.?\s*$/gm, '');
  
  // Remove **Illustration:** or **Image Prompt:** labels but keep content
  clean = clean.replace(/\*\*(?:Illustration|Image Prompt):\*\*\s*/gi, '');
  
  // Remove bullet point markers at start of lines
  clean = clean.replace(/^[-*]\s+/gm, '');
  
  // Clean up extra whitespace
  clean = clean.replace(/\n{3,}/g, '\n\n').trim();
  
  // Ensure proper ending if not present
  if (!clean.toLowerCase().includes('no text overlay')) {
    clean = clean.replace(/\.?\s*$/, '. No text overlays. Clean illustration only.');
  }
  
  return clean;
}
```

---

## Testing Checklist

- [ ] Verify prompt with `- Text Overlay: "Shelly is hot!"` is stripped
- [ ] Verify prompt with `- Opposite Pair: Hot / Cold` is stripped
- [ ] Verify prompt with `- **Text Overlay:** "..."` (bold bullet) is stripped
- [ ] Verify scene descriptions remain intact (only labels removed)
- [ ] Verify existing rhyming agent prompts still sanitize correctly
- [ ] Confirm log shows "YES (text content removed)" for opposites prompts
- [ ] Generate test image and verify no text appears

---

## Expected Outcome

**Before (Current Behavior)**:
```
🧹 Prompt sanitized: NO (already clean)
```
Result: Image contains "COLD" text

**After (Fixed)**:
```
🧹 Prompt sanitized: YES (text content removed)
```
Result: Clean illustration without any text labels
