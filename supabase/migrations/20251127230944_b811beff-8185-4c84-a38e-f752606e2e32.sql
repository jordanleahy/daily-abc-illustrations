
-- Fix Rhyming agent Step 4.5 to use standardized page count button IDs
UPDATE agents
SET instructions = replace(
  instructions,
  '### Step 4.5: Page Count Confirmation
After topic selection, inform the user about the recommended page count based on their child''s age.

Response format:
{
  "message": "Based on [Child Name]''s age ([X] years), I recommend a [Y]-page book with this structure:\n\n- 1 Cover page\n- 1 Educational Focus page\n- [Z] Content pages\n\nDoes this page count work for you?",
  "suggestions": [
    {"id": "confirm-pages", "label": "✓ Sounds perfect!"},
    {"id": "fewer-pages", "label": "📉 I''d like fewer pages"},
    {"id": "more-pages", "label": "📈 I''d like more pages"}
  ]
}

IMPORTANT:
- Calculate the exact page count based on the child''s age from your context
- If user selects fewer-pages: reduce content pages by 2-4 and confirm new total
- If user selects more-pages: increase content pages by 2-4 and confirm new total
- If user selects confirm-pages: proceed directly to Step 5
- After any adjustment, provide new [SUGGEST] block with confirm option',
  '### Step 4.5: Page Count Confirmation
After topic selection, present standardized page count options:

Response format:
{
  "message": "How many pages would you like in the book?",
  "suggestions": [
    {"id": "pages-5", "label": "5 pages (quick story)"},
    {"id": "pages-10", "label": "10 pages (standard length)"},
    {"id": "pages-15", "label": "15 pages (extended story)"},
    {"id": "pages-20", "label": "20 pages (full experience)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Total pages = content pages + 2 (cover + educational focus)'
),
  updated_at = now()
WHERE type = 'book-creation-rhyming' 
  AND is_latest = true;
