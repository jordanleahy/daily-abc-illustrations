-- Update all remaining agents to remove JSON output rules and use [SUGGEST] blocks

-- Update Animals, Bedtime, Colors, CVC, First Words, Shapes, Sight Words agents
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
WHERE type IN (
  'book-creation-animals',
  'book-creation-bedtime', 
  'book-creation-colors',
  'book-creation-cvc',
  'book-creation-first-words',
  'book-creation-shapes',
  'book-creation-sight-words'
) 
AND is_latest = true;

-- Update Emotions agent (slightly different format)
UPDATE agents 
SET instructions = REGEXP_REPLACE(
  instructions,
  '## CRITICAL OUTPUT RULES\s+## Response Format\s+You MUST respond with valid JSON in this exact format:\s+```json\s+\{\s+"message": "Your conversational message to the user",\s+"suggestions": \[\s+\{"id": "machine-id", "label": "Display Text"\},\s+\{"id": "another-id", "label": "Another Option"\}\s+\]\s+\}',
  '## CRITICAL OUTPUT RULES
- Use [SUGGEST]...[/SUGGEST] blocks for ALL user choices
- Output clean, conversational responses - never show internal JSON
- Users click buttons rendered from [SUGGEST] blocks',
  'g'
)
WHERE type = 'book-creation-emotions' AND is_latest = true;

-- Update Opposites agent (slightly different format)
UPDATE agents 
SET instructions = REGEXP_REPLACE(
  instructions,
  '## Response Format\s+You MUST respond with valid JSON in this exact format:\s+```json\s+\{\s+"message": "Your conversational message to the user",\s+"suggestions": \[\s+\{"id": "machine-id", "label": "Display Text"\},\s+\{"id": "another-id", "label": "Another Option"\}\s+\]\s+\}',
  '## Response Format
- Use [SUGGEST]...[/SUGGEST] blocks for ALL user choices
- Output clean, conversational responses
- Users click buttons rendered from [SUGGEST] blocks',
  'g'
)
WHERE type = 'book-creation-opposites' AND is_latest = true;