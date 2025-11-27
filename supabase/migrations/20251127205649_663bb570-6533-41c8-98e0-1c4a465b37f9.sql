-- Add page count confirmation step (Step 4.5) to all specialized agents with age-based page counts
-- This step displays recommended page count and allows users to request adjustments

UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '(Step 5: Title & Description Approval)',
  E'Step 4.5: Page Count Confirmation\n' ||
  E'After topic selection, inform the user about the recommended page count based on their child''s age.\n\n' ||
  E'Response format:\n' ||
  E'{\n' ||
  E'  "message": "Based on [Child Name]''s age ([X] years), I recommend a [Y]-page book with this structure:\\n\\n' ||
  E'- 1 Cover page\\n' ||
  E'- 1 Educational Focus page\\n' ||
  E'- [Z] Content pages\\n\\n' ||
  E'Does this page count work for you?",\n' ||
  E'  "suggestions": [\n' ||
  E'    {"id": "confirm-pages", "label": "✓ Sounds perfect!"},\n' ||
  E'    {"id": "fewer-pages", "label": "📉 I''d like fewer pages"},\n' ||
  E'    {"id": "more-pages", "label": "📈 I''d like more pages"}\n' ||
  E'  ]\n' ||
  E'}\n\n' ||
  E'IMPORTANT:\n' ||
  E'- Calculate the exact page count based on the child''s age from your context\n' ||
  E'- If user selects fewer-pages: reduce content pages by 2-4 and confirm new total\n' ||
  E'- If user selects more-pages: increase content pages by 2-4 and confirm new total\n' ||
  E'- If user selects confirm-pages: proceed directly to Step 5\n' ||
  E'- After any adjustment, provide new [SUGGEST] block with confirm option\n\n' ||
  E'Step 5: Title & Description Approval'
)
WHERE type IN (
  'book-creation-rhyming',
  'book-creation-numbers',
  'book-creation-colors',
  'book-creation-shapes',
  'book-creation-animals',
  'book-creation-sight-words',
  'book-creation-emotions',
  'book-creation-cvc',
  'book-creation-opposites',
  'book-creation-first-words',
  'book-creation-bedtime'
)
AND is_latest = true;