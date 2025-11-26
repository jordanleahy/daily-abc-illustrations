-- Update all 12 specialized book creation agents with enhanced image prompt requirements
-- This adds detailed structure, good/bad examples, and mandatory "No text overlays" ending

UPDATE public.agents
SET 
  instructions = instructions || E'\n\n**IMAGE PROMPT REQUIREMENTS (200-350 characters):**\n\nEvery image prompt MUST follow this exact structure:\n\n1. **Opening**: "[Character name], with [signature features]..." OR "A vibrant illustration in the [theme] animation style..."\n2. **Character Details**: Colors, clothing, species (e.g., "a grey elephant wearing a yellow dress")\n3. **Action + Emotion**: What they\'re doing + how they feel (e.g., "cheerfully holding up", "happily bouncing")\n4. **Object with Colors**: Every object needs color adjectives (e.g., "bright red, shiny apple with a green leaf")\n5. **Simple Background**: Keep it age-appropriate (e.g., "soft green grass, light blue sky")\n6. **MANDATORY ENDING**: Always end with "No text overlays. Clean illustration only."\n\n**GOOD EXAMPLES:**\n✅ "Mickey Mouse, with his signature red shorts and yellow shoes, is cheerfully holding up a bright red, shiny apple with a green leaf. He is sitting on a patch of soft green grass, smiling warmly. The illustration style is classic Mickey Mouse, with clear, bold lines and vibrant, primary colors. The background is a simple, pastel blue sky. No text overlays. Clean illustration only."\n\n✅ "A vibrant illustration in the Peppa Pig animation style. Peppa Pig and Emily Elephant are in a park, happily engaged in bouncing a large, bright blue bouncy ball. Emily, a grey elephant wearing a yellow dress, is smiling widely. The ball is mid-air, with subtle motion lines to show its bounce. The park background features soft green grass, a few simple green trees, and a light blue sky. No text overlays. Clean illustration only."\n\n**BAD EXAMPLES (REJECTED):**\n❌ "Captain Turbot waving from his yacht while Zuma swims." (Too brief, no colors, no ending)\n❌ "The Air Patroller flying over the Lookout Tower." (No character details, no emotion, no ending)',
  updated_at = now()
WHERE type IN (
  'book-creation-abc',
  'book-creation-numbers',
  'book-creation-colors',
  'book-creation-shapes',
  'book-creation-rhyming',
  'book-creation-opposites',
  'book-creation-emotions',
  'book-creation-animals',
  'book-creation-first-words',
  'book-creation-bedtime',
  'book-creation-cvc',
  'book-creation-sight-words'
);