-- Fix Numbers agent to remove JSON output rules and use [SUGGEST] blocks
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '🎯 CRITICAL OUTPUT RULES (READ FIRST):
1. EVERY response MUST contain exactly one ```json...``` block
2. If your response lacks ```json, stop and regenerate with buttons
3. Users click buttons - they should NEVER need to type responses
4. Each discovery step shows: question text + ```json block with options
---',
  '🎯 CRITICAL OUTPUT RULES:
- Use [SUGGEST]...[/SUGGEST] blocks for ALL user choices
- Output clean, conversational responses - never show internal JSON
- Users click buttons rendered from [SUGGEST] blocks
---'
)
WHERE type = 'book-creation-numbers' AND is_latest = true;

-- Remove the duplicate character theme list after [SUGGEST] block
UPDATE agents 
SET instructions = REGEXP_REPLACE(
  instructions,
  '\[/SUGGEST\]\naround-the-mountain:.*?no-theme: 📚 Classic Nu',
  '[/SUGGEST]',
  'g'
)
WHERE type = 'book-creation-numbers' AND is_latest = true;

-- Remove the header that mentions JSON blocks
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '=== CONVERSATION FLOW (ALL RESPONSES USE ```json BLOCKS) ===',
  '=== CONVERSATION FLOW ==='
)
WHERE type = 'book-creation-numbers' AND is_latest = true;