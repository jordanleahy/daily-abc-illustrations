-- Update all specialized book creation agents to enforce [SUGGEST] block output
-- This ensures AI always outputs buttons, not free-form questions

UPDATE agents
SET 
  instructions = CONCAT(
    E'🎯 CRITICAL OUTPUT RULES (READ FIRST):\n',
    E'1. EVERY response MUST contain exactly one [SUGGEST]...[/SUGGEST] block\n',
    E'2. If your response lacks [SUGGEST], stop and regenerate with buttons\n',
    E'3. Users click buttons - they should NEVER need to type responses\n',
    E'4. Each discovery step shows: question text + [SUGGEST] block with options\n',
    E'5. Use "OUTPUT THIS EXACTLY:" markers for each step\n\n',
    E'---\n\n',
    instructions
  ),
  updated_at = now()
WHERE type IN (
  'book-creation-abc',
  'book-creation-numbers', 
  'book-creation-rhyming',
  'book-creation-colors',
  'book-creation-shapes',
  'book-creation-animals',
  'book-creation-emotions',
  'book-creation-opposites',
  'book-creation-first-words',
  'book-creation-cvc',
  'book-creation-sight-words',
  'book-creation-bedtime'
)
AND is_latest = true;