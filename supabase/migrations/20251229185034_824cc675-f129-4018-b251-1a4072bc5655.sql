-- Add Clothing Brand question to all book-creation agents
-- This is an optional final discovery question for character attire

UPDATE agents
SET 
  instructions = instructions || E'\n\n**Clothing Brand Question:**\nWould you like characters to wear branded clothing?\n\n[SUGGEST]\nBURTON: 🏂 Burton\nNONE: 👕 No brand\nskip-clothing-brand: ⏭️ Skip\n[/SUGGEST]',
  last_modified = now(),
  updated_at = now()
WHERE is_latest = true
  AND type LIKE 'book-creation-%';