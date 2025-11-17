# Prompt Preservation Validation Test

## Quick Validation

Run this test to verify prompts are preserved correctly:

### 1. Check Database Before

```sql
-- Count existing prompts by source
SELECT 
  source_type,
  COUNT(*) as count,
  ROUND(AVG(LENGTH(content))) as avg_length,
  MIN(LENGTH(content)) as min_length,
  MAX(LENGTH(content)) as max_length
FROM page_system_prompts
GROUP BY source_type;
```

Expected output:
```
source_type         | count | avg_length | min_length | max_length
--------------------|-------|------------|------------|------------
chat_generated      |   52  |    987     |    456     |   1543
template_generated  |   78  |    234     |    123     |    345
manual              |   12  |    567     |    234     |    890
```

### 2. Create Test Book with Long Prompts

Use GoogleChat to create a book, ensuring prompts are detailed. Example:

```
User: "Create an ABC book about winter sports with The Fun Bear Family"

AI: [generates detailed prompts]

User: "Yes, create that book"
```

### 3. Verify in Database After Creation

```sql
-- Get the most recent book
SELECT id, book_name, created_at 
FROM books 
ORDER BY created_at DESC 
LIMIT 1;

-- Check its prompts (use book ID from above)
SELECT 
  p.page_number,
  p.title,
  psp.source_type,
  LENGTH(psp.content) as prompt_length,
  LEFT(psp.content, 100) as preview,
  psp.generation_metadata->>'preservedFromChat' as from_chat
FROM pages p
JOIN page_system_prompts psp ON psp.page_id = p.id AND psp.is_latest = true
WHERE p.book_id = 'BOOK_ID_HERE'
ORDER BY p.page_number;
```

**✅ Pass Criteria:**
- `source_type = 'chat_generated'` for all pages
- `prompt_length > 400` for most pages (detailed prompts)
- `from_chat = 'true'` in metadata
- Preview shows detailed content with style guides, character descriptions

**❌ Fail Indicators:**
- `source_type = 'template_generated'` 
- `prompt_length < 300` consistently
- `from_chat IS NULL`
- Preview shows simple, generic descriptions

### 4. Test Copy Functionality

1. Open the book in Book Editor
2. Click any page
3. Click "Copy Image Prompt" button
4. Paste into a text editor

**✅ Pass:** Full prompt appears (500-1500+ characters)
```
The Fun Bear Family stands together, looking out at the panoramic view of the snowy Stowe resort village from a slightly elevated viewpoint. Mama Bear (medium brown fur, cream knitted sweater), Papa Bear (large chocolate fur, plaid flannel shirt), Big Sister Bear (light brown fur, pink winter jacket), and Little Brother Bear (fluffy golden fur, colorful pom-pom hat) are all visible, with warm smiles. The village below is bustling with tiny figures, rustic lodges, and snow-covered trees. The sky is a clear ice blue with soft winter sunlight. The Gondola House is visible in the middle distance. The scene evokes a sense of warmth and wonder. CRITICAL STYLE: Semi-stylized 3D painterly quality with visible brush strokes, soft edges, NOT comic book style, NOT cartoon outlines, NO thick black borders. Cinematic Frozen-inspired lighting with magical realism. ABSOLUTELY NO TEXT IN IMAGE: No signs, no labels, no writing of any kind anywhere in the scene.
```

**❌ Fail:** Prompt is cut off
```
The Fun Bear Family stands together, looking out at the panoramic view of the snowy Stowe resort village from a slightly elevated viewpoint. Mama Bear medium brown fur, cream knitted sweater, Papa Bear large chocolate fur, plaid flannel shirt, Big Sister Bear light brown fur, pink winter jacket, and Little Brother Bear fluffy golden fur, colorful pom-pom hat are all visible, with warm smiles. The village below is bustling with tiny figures, rustic lodges, and snow-covered trees. The sky is a cle [TRUNCATED]
```

## Edge Function Logs Validation

Check the edge function logs to see which path was taken:

### ✅ Successful Preservation (PATH 1)

```
[PROMPT PRESERVATION] Using 28 full prompts from chat session
[PROMPT PRESERVATION] Book: Winter Sports ABC (abc123-...)
[PROMPT PRESERVATION] Matching 28 prompts to 28 pages
[PROMPT PRESERVATION] ✓ Page 0 (Cover): 987 chars
[PROMPT PRESERVATION] ✓ Page 1 (Focus): 654 chars
[PROMPT PRESERVATION] ✓ Page 2 ((a) is for avalanche): 1234 chars
...
[PROMPT PRESERVATION COMPLETE]
  ✓ Created: 28
  ✗ Skipped: 0
  📏 Avg length: 876 chars
  📊 Total: 24528 chars
  📉 Shortest: Page 1 (654 chars)
  📈 Longest: Page 15 (1543 chars)
[PROMPT PRESERVATION] ✅ Using preserved prompts from chat
```

### ❌ Fallback to Generation (PATH 2)

```
[PROMPT GENERATION] No full prompts provided - generating from page data
[PROMPT GENERATION] ✓ Generated 28 prompts for 28 pages
```

### 🔧 Partial Failure with Recovery

```
[PROMPT PRESERVATION] Using 28 full prompts from chat session
[PROMPT PRESERVATION ERROR] Invalid page number: "cover" - skipping
[PROMPT PRESERVATION] ✓ Page 1 (Focus): 654 chars
[PROMPT PRESERVATION WARNING] Page 99 not found - skipping
...
[PROMPT PRESERVATION COMPLETE]
  ✓ Created: 26
  ✗ Skipped: 2
```

## Regression Test Suite

### Test Case 1: Full Prompts Provided

**Input:**
```json
{
  "conversationHistory": [...],
  "userId": "user-123",
  "fullPrompts": {
    "0": "A very detailed cover prompt with 500+ characters describing the scene, characters, style, and specific visual requirements including color palette and composition...",
    "1": "A very detailed focus prompt...",
    "2": "A very detailed page A prompt..."
  }
}
```

**Expected:**
- ✅ All prompts stored exactly as provided
- ✅ `source_type = 'chat_generated'`
- ✅ Average length > 500 characters
- ✅ Copy functionality returns full text

### Test Case 2: No Prompts Provided

**Input:**
```json
{
  "conversationHistory": [...],
  "userId": "user-123",
  "pageDetails": [
    { "pageNumber": 0, "title": "Cover", "description": "Book cover" },
    { "pageNumber": 1, "title": "Focus", "description": "Learning goals" }
  ]
}
```

**Expected:**
- ✅ Prompts generated from template
- ✅ `source_type = 'template_generated'`
- ✅ Average length 100-300 characters
- ✅ Book created successfully

### Test Case 3: Mixed Valid/Invalid Prompts

**Input:**
```json
{
  "fullPrompts": {
    "0": "Valid long prompt...",
    "1": "",           // Empty - should skip
    "invalid": "...",  // Invalid page number - should skip
    "2": "Valid long prompt...",
    "3": null         // Null - should skip
  }
}
```

**Expected:**
- ✅ Valid prompts (0, 2) stored
- ✅ Invalid prompts (1, invalid, 3) skipped
- ✅ Logs show skipped count
- ✅ No errors thrown

### Test Case 4: Database Failure Recovery

**Scenario:** `page_system_prompts` insert fails

**Expected:**
- ✅ Error logged per page
- ✅ Other pages continue processing
- ✅ Book creation completes
- ✅ Fallback to generation attempted

## Performance Benchmarks

Expected execution times:

| Scenario | Pages | Time (avg) | Notes |
|----------|-------|------------|-------|
| PATH 1 (chat prompts) | 26 | 2-3s | Direct DB inserts |
| PATH 2 (generation) | 26 | 5-8s | Calls separate function |
| Mixed (partial fail) | 26 | 3-5s | Some inserts, some skips |

**Red flags:**
- ⚠️ > 10 seconds for PATH 1 (DB performance issue)
- ⚠️ > 15 seconds for PATH 2 (generation bottleneck)
- ⚠️ Timeout errors (need to optimize batch operations)

## Monitoring Queries

### Daily Preservation Rate

```sql
-- How often are we using PATH 1 vs PATH 2?
SELECT 
  DATE(created_at) as date,
  source_type,
  COUNT(*) as prompt_count,
  ROUND(AVG(LENGTH(content))) as avg_length
FROM page_system_prompts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), source_type
ORDER BY date DESC, source_type;
```

### Prompt Length Distribution

```sql
-- Are prompts being preserved at full length?
SELECT 
  source_type,
  CASE 
    WHEN LENGTH(content) < 200 THEN '<200 chars'
    WHEN LENGTH(content) < 500 THEN '200-500 chars'
    WHEN LENGTH(content) < 1000 THEN '500-1000 chars'
    ELSE '>1000 chars'
  END as length_bucket,
  COUNT(*) as count
FROM page_system_prompts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY source_type, length_bucket
ORDER BY source_type, length_bucket;
```

### Preservation Success Rate

```sql
-- What % of chat-created books preserve prompts successfully?
WITH book_stats AS (
  SELECT 
    b.id as book_id,
    b.book_name,
    b.created_at,
    COUNT(DISTINCT psp.id) as prompt_count,
    COUNT(DISTINCT psp.id) FILTER (WHERE psp.source_type = 'chat_generated') as chat_prompt_count,
    COUNT(DISTINCT p.id) as page_count
  FROM books b
  LEFT JOIN pages p ON p.book_id = b.id
  LEFT JOIN page_system_prompts psp ON psp.page_id = p.id AND psp.is_latest = true
  WHERE b.created_at > NOW() - INTERVAL '7 days'
  GROUP BY b.id, b.book_name, b.created_at
)
SELECT 
  COUNT(*) as total_books,
  SUM(CASE WHEN chat_prompt_count = page_count THEN 1 ELSE 0 END) as fully_preserved,
  ROUND(100.0 * SUM(CASE WHEN chat_prompt_count = page_count THEN 1 ELSE 0 END) / COUNT(*), 2) as preservation_rate_pct,
  AVG(page_count) as avg_pages_per_book,
  AVG(CASE WHEN chat_prompt_count > 0 THEN chat_prompt_count ELSE NULL END) as avg_chat_prompts
FROM book_stats;
```

Expected result:
```
total_books | fully_preserved | preservation_rate_pct | avg_pages_per_book | avg_chat_prompts
------------|-----------------|----------------------|--------------------|-----------------
     50     |       47        |        94.00         |        27.5        |      26.8
```

**Target KPIs:**
- ✅ Preservation rate > 90%
- ✅ Chat prompts avg length > 500 chars
- ✅ Template prompts avg length 150-300 chars
