-- Add static options for letter_case question
UPDATE questions
SET static_options = '[
  {"id": "LETTER_CASE_LOWERCASE", "label": "Lowercase", "description": "Lowercase letters (a, b, c) - great for toddlers", "emoji": "🔤"},
  {"id": "LETTER_CASE_UPPERCASE", "label": "Uppercase", "description": "Uppercase letters (A, B, C) - for preschoolers", "emoji": "🔠"},
  {"id": "LETTER_CASE_BOTH", "label": "Both Cases", "description": "Both cases (Aa, Bb, Cc) - for early readers", "emoji": "📝"}
]'::jsonb
WHERE id = 'letter_case' AND static_options IS NULL;