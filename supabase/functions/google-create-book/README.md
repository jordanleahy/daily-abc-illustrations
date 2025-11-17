# Google Create Book Edge Function

## Overview

This edge function creates educational ABC books from AI chat conversations. It handles the complete book creation workflow including pages, prompts, and metadata.

## Critical Feature: Full Prompt Preservation

### Problem Statement

When users copy image generation prompts from the Book Editor, they were getting truncated versions:

**Before Fix:**
```
The Fun Bear Family stands together, looking out at the panoramic view of the snowy Stowe resort village from a slightly elevated viewpoint. Mama Bear medium brown fur, cream knitted sweater, Papa Bear large chocolate fur, plaid flannel shirt, Big Sister Bear light brown fur, pink winter jacket, and Little Brother Bear fluffy golden fur, colorful pom-pom hat are all visible, with warm smiles. The village below is bustling with tiny figures, rustic lodges, and snow-covered trees. The sky is a cle [TRUNCATED]
```

**After Fix:**
```
The Fun Bear Family stands together, looking out at the panoramic view of the snowy Stowe resort village from a slightly elevated viewpoint. Mama Bear (medium brown fur, cream knitted sweater), Papa Bear (large chocolate fur, plaid flannel shirt), Big Sister Bear (light brown fur, pink winter jacket), and Little Brother Bear (fluffy golden fur, colorful pom-pom hat) are all visible, with warm smiles. The village below is bustling with tiny figures, rustic lodges, and snow-covered trees. The sky is a clear ice blue with soft winter sunlight. The Gondola House is visible in the middle distance. The scene evokes a sense of warmth and wonder. CRITICAL STYLE: Semi-stylized 3D painterly quality with visible brush strokes, soft edges, NOT comic book style, NOT cartoon outlines, NO thick black borders. Cinematic Frozen-inspired lighting with magical realism. ABSOLUTELY NO TEXT IN IMAGE: No signs, no labels, no writing of any kind anywhere in the scene. The Gondola House building should have NO visible text or signage. No text overlays. Clean illustration only.
```

### Solution: Two-Path Strategy

```typescript
// PATH 1: Preserve Full Chat Prompts (Preferred)
if (fullPrompts && Object.keys(fullPrompts).length > 0) {
  // Store EXACTLY as provided - NO TRUNCATION
  // These are 500-1500+ character detailed prompts from chat
  content: trimmedContent, // Stored byte-for-byte
  source_type: 'chat_generated'
}

// PATH 2: Generate New Prompts (Fallback)
else {
  // Generate shorter 100-300 character prompts from metadata
  source_type: 'template_generated'
}
```

## Input Parameters

```typescript
{
  conversationHistory: Message[],     // Full chat history
  userId: string,                      // UUID of user
  pageDetails?: PageDetail[],          // Structured page data from chat
  qaImages?: Record<string, string>,   // Base64 images by page number
  bookType?: string,                   // 'abc' | 'numbers' | 'story' | etc
  textOverlayPreference?: string,      // 'with-text' | 'without-text'
  referenceBookId?: string,           // UUID for style copying
  fullPrompts?: Record<string, string>, // ⭐ FULL IMAGE PROMPTS FROM CHAT
  targetWords?: string[],             // Word learning targets
  educationalFocus?: {                // Learning objectives
    targetAge: string,
    learningType: string,
    specificSkill: string,
    imagePrompt: string
  }
}
```

### fullPrompts Parameter

**Type:** `Record<string, string>`  
**Format:** `{ "0": "cover prompt...", "1": "focus prompt...", "2": "page A prompt..." }`  
**Purpose:** Preserve complete image generation prompts from chat conversation

**When Provided:**
- Prompts are stored EXACTLY as provided
- NO truncation or modification
- NO regeneration from templates
- Source tagged as `'chat_generated'`

**When NOT Provided:**
- New prompts generated from page metadata
- Shorter, template-based prompts (100-300 chars)
- Source tagged as `'template_generated'`

## Monitoring & Debugging

### Log Prefixes

```typescript
'[PROMPT PRESERVATION]'      // PATH 1: Using chat prompts
'[PROMPT PRESERVATION ERROR]' // PATH 1: Errors
'[PROMPT GENERATION]'        // PATH 2: Generating prompts
'[PROMPT GENERATION ERROR]'  // PATH 2: Errors
```

### Success Metrics

```typescript
console.log('[PROMPT PRESERVATION COMPLETE]');
console.log(`  ✓ Created: ${promptsCreated}`);      // Successfully stored
console.log(`  ✗ Skipped: ${promptsSkipped}`);      // Failed/invalid
console.log(`  📏 Avg length: ${avgLength} chars`); // ~500-1500 for chat
console.log(`  📊 Total: ${totalPromptLength} chars`);
console.log(`  📉 Shortest: Page ${n} (${chars} chars)`);
console.log(`  📈 Longest: Page ${n} (${chars} chars)`);
```

### Error Handling

The function uses **graceful degradation**:

1. **Primary failure** (fullPrompts provided but can't be saved)
   - Logs detailed errors
   - Falls back to PATH 2 (generation)
   - Book creation continues

2. **Secondary failure** (generation also fails)
   - Logs error
   - Book still created successfully
   - Prompts can be regenerated via UI later

**This ensures books are never lost due to prompt issues.**

## Database Schema

### page_system_prompts Table

```sql
CREATE TABLE page_system_prompts (
  id UUID PRIMARY KEY,
  page_id UUID NOT NULL,
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,              -- ⭐ Unlimited length
  is_latest BOOLEAN DEFAULT true,
  is_deployed BOOLEAN DEFAULT false,
  deployed_at TIMESTAMP,
  source_type TEXT NOT NULL,          -- 'chat_generated' | 'template_generated' | 'manual'
  prompt_status TEXT DEFAULT 'complete',
  generation_metadata JSONB,          -- Tracks preservation metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Key Fields

- **content**: TEXT type (no length limit) - stores full prompts
- **source_type**: Tracks origin for analytics and debugging
- **generation_metadata**: Stores preservation info:
  ```json
  {
    "preservedFromChat": true,
    "originalLength": 1234,
    "timestamp": "2025-11-17T01:39:00Z"
  }
  ```

## Security

### Input Validation

- **Upstream validation**: Zod schema validates all inputs
- **Content sanitization**: Done in request parsing
- **Length limits**: No DB limit (TEXT field), reasonable upstream validation
- **XSS protection**: Stored as plain text, never executed
- **Access control**: RLS policies on table

### Authentication

- **User verification**: `auth.uid()` checked upstream
- **Ownership**: `user_id` column enforces ownership
- **Service role**: Edge function uses service role key for writes

## Testing

### Manual QA Checklist

✅ Test PATH 1 (Chat Prompts):
```bash
# Create book with fullPrompts
curl -X POST $EDGE_FUNC_URL \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "...",
    "conversationHistory": [...],
    "fullPrompts": {
      "0": "Very long detailed cover prompt with 500+ characters...",
      "1": "Very long detailed focus prompt with 500+ characters...",
      "2": "Very long detailed page A prompt with 500+ characters..."
    }
  }'

# Verify in DB
SELECT 
  page_number,
  source_type,
  LENGTH(content) as prompt_length,
  generation_metadata
FROM page_system_prompts psp
JOIN pages p ON p.id = psp.page_id
WHERE book_id = '...'
ORDER BY page_number;
```

✅ Test PATH 2 (Generated):
```bash
# Create book WITHOUT fullPrompts
curl -X POST $EDGE_FUNC_URL \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "...",
    "conversationHistory": [...],
    "pageDetails": [...]
  }'

# Verify shorter prompts
SELECT 
  page_number,
  source_type,
  LENGTH(content) as prompt_length
FROM page_system_prompts psp
JOIN pages p ON p.id = psp.page_id
WHERE book_id = '...'
ORDER BY page_number;
```

✅ Test Copy Functionality:
1. Create book with long prompts
2. Navigate to Book Editor
3. Click "Copy Image Prompt" button
4. Paste into text editor
5. Verify full prompt (500-1500+ chars, not truncated)

### Expected Behavior

| Scenario | Expected Result |
|----------|----------------|
| fullPrompts provided | Stored exactly, 500-1500+ chars, source='chat_generated' |
| No fullPrompts | Generated from metadata, 100-300 chars, source='template_generated' |
| Invalid prompt | Skipped, logged, continues with others |
| All prompts fail | Falls back to generation, book still created |
| Generation fails | Book created without prompts (can regenerate later) |

## Performance

- **Prompt storage**: O(n) where n = number of pages (26 for ABC books)
- **Average execution**: ~2-3 seconds for PATH 1, ~5-8 seconds for PATH 2
- **Database impact**: Single INSERT per page (~26 INSERTs for ABC book)
- **No external API calls**: All database operations

## Troubleshooting

### Issue: Prompts still truncated after fix

**Check:**
```sql
-- Verify prompts were stored from chat
SELECT 
  book_id,
  source_type,
  COUNT(*) as prompt_count,
  AVG(LENGTH(content)) as avg_length
FROM page_system_prompts
WHERE book_id = 'YOUR_BOOK_ID'
GROUP BY book_id, source_type;
```

**Expected:**
- `source_type = 'chat_generated'`
- `avg_length > 500` (chat prompts are detailed)

**If showing 'template_generated':**
- Frontend didn't send fullPrompts
- Check GoogleChat component
- Verify chat session state

### Issue: No prompts created at all

**Check logs:**
```
[PROMPT PRESERVATION ERROR] Failed to fetch pages
[PROMPT GENERATION ERROR] Failed to generate prompts
```

**Resolution:**
1. Book IS created successfully
2. Manually regenerate via UI
3. Or call `generate-page-system-prompts` function

### Issue: Some pages have prompts, others don't

**Check:**
```sql
SELECT 
  p.page_number,
  p.title,
  psp.id IS NOT NULL as has_prompt,
  LENGTH(psp.content) as prompt_length
FROM pages p
LEFT JOIN page_system_prompts psp ON psp.page_id = p.id AND psp.is_latest = true
WHERE p.book_id = 'YOUR_BOOK_ID'
ORDER BY p.page_number;
```

**Common causes:**
- Invalid page numbers in fullPrompts
- Missing pages in createdPages query
- Individual INSERT failures (check error logs)

## Related Documentation

- [Image Generation System](../../../docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md)
- [Chat Integration](../../chat/index.ts)
- [Page System Prompts Hook](../../../src/hooks/usePageSystemPrompt.ts)
- [Generate Page Prompts Function](../generate-page-system-prompts/index.ts)
