-- Fix outline generation for all specialized book creation agents
-- Add explicit instructions to generate complete outline in approval response

UPDATE agents
SET instructions = instructions || E'\n\n' || E'CRITICAL STEP 6 EXECUTION REQUIREMENT:\n' ||
E'When user approves the title/description (Step 5 → Step 6), your response message field MUST contain the COMPLETE book outline immediately.\n\n' ||
E'DO NOT respond with just "Generating the complete outline..." or acknowledgment text.\n\n' ||
E'Your response message MUST include:\n' ||
E'1. Brief confirmation (1 sentence max)\n' ||
E'2. The COMPLETE outline with ALL pages formatted exactly as:\n\n' ||
E'**Page 1: [Title]**\n' ||
E'[Complete image prompt 200-350 characters]\n\n' ||
E'**Page 2: [Title]**\n' ||
E'[Complete image prompt 200-350 characters]\n\n' ||
E'... (continue for ALL remaining pages)\n\n' ||
E'The suggestions array must be empty [] since outline generation does not require buttons.\n\n' ||
E'VALIDATION: Your response must contain multiple "**Page N:" markers. If it does not, you have failed to generate the outline.'
WHERE type IN (
  'book-creation-abc',
  'book-creation-rhyming',
  'book-creation-colors',
  'book-creation-numbers',
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