-- Fix CVC agent: Add CRITICAL INSTRUCTION for cover title and Chairlift Habits branding
UPDATE agents
SET instructions = REPLACE(
  REPLACE(
    instructions,
    'Image prompt must end with "No text overlays. Clean illustration only."',
    'CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space.'
  ),
  '# CVC Book Creation Agent',
  '# CVC Book Creation Agent

You are a Chairlift Habits specialized agent for creating CVC (Consonant-Vowel-Consonant) books using the CVC Contrast Sentence Method.'
),
last_modified = NOW()
WHERE type = 'book-creation-cvc' AND is_latest = true;