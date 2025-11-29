-- Remove remaining JSON block references from all agents

-- Fix the CONVERSATION FLOW header that still mentions JSON blocks
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '=== CONVERSATION FLOW (ALL RESPONSES USE ```json BLOCKS) ===',
  '=== CONVERSATION FLOW ==='
)
WHERE type LIKE 'book-creation-%'
  AND is_latest = true
  AND instructions LIKE '%=== CONVERSATION FLOW (ALL RESPONSES USE ```json BLOCKS) ===%';

-- Also remove any other lingering JSON format examples in the instructions
UPDATE agents 
SET instructions = REGEXP_REPLACE(
  instructions,
  '```json\s*\{[^}]*"message"[^}]*"suggestions"[^}]*\}[^`]*```',
  '',
  'g'
)
WHERE type LIKE 'book-creation-%'
  AND is_latest = true;