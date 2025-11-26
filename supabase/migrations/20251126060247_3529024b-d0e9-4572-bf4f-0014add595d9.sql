-- Remove "Art style:" prefix from ABC agent image prompt instructions
UPDATE agents 
SET 
  instructions = REPLACE(
    instructions,
    '**Image Prompt Requirements (200-350 characters):**
Every content page image prompt MUST include:
1. Art Style Opening identifying theme/animation style
2. Character Details (species, colors, clothing/features)
3. Action + Emotion (what character does and how they feel)
4. Object with Colors using specific color adjectives
5. Simple Background age-appropriate setting
6. MANDATORY ENDING: "No text overlays. Clean illustration only."

Example good prompt (~300 chars):
"Cute cartoon style. Bluey the blue heeler puppy with floppy ears wearing her red collar, excited expression. Bluey discovering a bright red, shiny apple with a green leaf on top. Simple backyard setting with soft grass. Clean white background. No text overlays. Clean illustration only."',
    '**Image Prompt Requirements (200-350 characters):**
Every content page image prompt MUST be a single paragraph with NO labels or prefixes (NO "Art style:", NO "Description:", etc).

Start directly with the art style and flow naturally through all elements:
1. Art style/theme description
2. Character details (species, colors, clothing/features)
3. Action + emotion (what character does and how they feel)
4. Object with colors using specific color adjectives
5. Simple background age-appropriate setting
6. MANDATORY ENDING: "No text overlays. Clean illustration only."

Example good prompt (~300 chars):
"Cute cartoon style. Bluey the blue heeler puppy with floppy ears wearing her red collar, excited expression. Bluey discovering a bright red, shiny apple with a green leaf on top. Simple backyard setting with soft grass. Clean white background. No text overlays. Clean illustration only."'
  ),
  updated_at = now()
WHERE type = 'book-creation-abc' 
  AND is_latest = true;