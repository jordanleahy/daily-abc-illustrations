-- Update all book-creation agents to fix the conversation flow order
-- Move optional questions (location, season, environment) BEFORE title confirmation
-- Make title confirmation ("Looks great, create outline") the VERY LAST step

-- First, update the book-creation agent
UPDATE agents
SET instructions = REPLACE(
  REPLACE(
    instructions,
    '## OPTIONAL FINAL STEP: Location Selection

After generating the complete outline, offer the location option:',
    '## OPTIONAL QUESTIONS (Ask BEFORE Title Confirmation)

Ask these optional questions BEFORE proposing the title. The title confirmation should be the VERY LAST step before generating the outline.

**Location Question:**'
  ),
  'After location selection (or skip), proceed to book creation',
  '⚠️ CRITICAL FLOW ORDER: All optional questions (location, season, environment, clothing brand) MUST be asked BEFORE proposing the book title. The title confirmation ("✅ Looks great! Create the book") should be the VERY LAST step before generating the outline.'
),
updated_at = now()
WHERE is_latest = true
AND type LIKE 'book-creation%';

-- Also update any agents that have "Only ask these after all other discovery questions are complete, right before generating the outline."
UPDATE agents
SET instructions = REPLACE(
  instructions,
  'Only ask these after all other discovery questions are complete, right before generating the outline.',
  '⚠️ CRITICAL: Ask these questions BEFORE proposing the title. Title confirmation must be the VERY LAST step before outline generation.'
),
updated_at = now()
WHERE is_latest = true
AND type LIKE 'book-creation%';