UPDATE agents 
SET instructions = REPLACE(
  REPLACE(
    REPLACE(
      instructions,
      'Start with style header: "[STYLE]: [Character Style], [Visual Tone], [Lighting]"',
      'Start with character style (e.g., "Peppa Pig style, joyful and clean, bright lighting")'
    ),
    'Image prompt: [STYLE]: [Character style]',
    'Image prompt: [Character style]'
  ),
  '[STYLE]: [Character Style]',
  '[Character Style]'
),
updated_at = now()
WHERE type = 'book-creation-general' AND is_latest = true;