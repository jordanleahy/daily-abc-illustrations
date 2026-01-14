-- Update CVC agent split-scene prompt format to enforce edge-to-edge panels
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**Split-Scene Format:**
"[Theme character style] split-scene illustration. LEFT: [Character] with [Object A from Sentence A] in [setting]. RIGHT: Same [character] with [Object B from Sentence B] in same setting. Both [CVC objects] shown with bright, distinct colors for visual contrast. Full frame. No text overlays. Clean illustration only."',
  '**Split-Scene Format:**
"[Theme character style] split-scene illustration with two equal panels filling the entire frame edge-to-edge, no gaps or margins. LEFT PANEL (fills left half completely from top to bottom): [Character] with [Object A from Sentence A] in [setting]. RIGHT PANEL (fills right half completely from top to bottom): Same [character] with [Object B from Sentence B] in same setting. Both panels extend to all edges with no padding, borders, or rounded corners. Both [CVC objects] shown with bright, distinct colors for visual contrast. Full-bleed composition. No text overlays. Clean illustration only."'
),
last_modified = NOW(),
updated_at = NOW()
WHERE type = 'book-creation-cvc' AND is_latest = true;