-- Update shapes agent content page title format to question style
UPDATE agents
SET 
  instructions = REPLACE(
    instructions,
    '**Page 3: [Shape Name]**
[Shape content image prompt 200-350 chars with real-world objects featuring that shape, ending with "No text overlays. Clean illustration only."]',
    '**Page 3: Can you see the [Shape Name] shape?**
[Shape content image prompt 200-350 chars with real-world objects featuring that shape, ending with "No text overlays. Clean illustration only."]

NOTE: ALL content pages (3-12) must use this question format: "Can you see the [shape] shape?" Examples:
- "Can you see the circle shape?"
- "Can you see the square shape?"  
- "Can you see the triangle shape?"'
  ),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-shapes' AND is_latest = true;