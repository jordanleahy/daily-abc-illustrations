-- Update CVC agent split-scene prompt with percentage-based zone instructions
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**Split-Scene Format:**
"[Theme character style] split-scene illustration with two equal 1:1 square panels, tight crop, full-frame composition filling every pixel. LEFT PANEL: [Character] with [Object A from Sentence A] in [setting]. RIGHT PANEL: Same [character] with [Object B from Sentence B] in same setting. CRITICAL COMPOSITION RULES: Sky/background extends to the very top edge of each panel, ground/floor/foreground extends to the very bottom edge. No empty space above or below the scene. Full-bleed borderless illustration with no negative space, no margins. Scene elements touch all four edges of each panel. Both [CVC objects] shown with bright, distinct colors for visual contrast. No text overlays. Clean illustration only."',
  '**Split-Scene Format:**
"[Theme character style] split-scene illustration with two equal panels. LEFT PANEL: [Character] with [Object A from Sentence A] in [setting]. RIGHT PANEL: Same [character] with [Object B from Sentence B] in same setting. VERTICAL ZONE REQUIREMENTS: Upper 25% of each panel must be filled with sky, clouds, ceiling, or tree canopy. Middle 50% contains the character and CVC objects. Lower 25% must be filled with ground, floor, grass, or textured surface. No white space or empty areas anywhere. Every pixel must contain illustration content. Both [CVC objects] shown with bright, distinct colors for visual contrast. No text overlays. Clean illustration only."'
),
last_modified = NOW(),
updated_at = NOW()
WHERE type = 'book-creation-cvc' AND is_latest = true;