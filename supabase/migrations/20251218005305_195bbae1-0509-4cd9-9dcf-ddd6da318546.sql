-- Add Dora to all specialized book creation agents' theme [SUGGEST] blocks
-- Insert dora after bear-stories in each agent's instructions

UPDATE agents 
SET instructions = REPLACE(
  instructions,
  'bear-stories: 🐻 Bear Stories
custom:',
  'bear-stories: 🐻 Bear Stories
dora: 🎒 Dora the Explorer
custom:'
),
updated_at = NOW()
WHERE is_latest = true 
  AND instructions LIKE '%bear-stories%' 
  AND instructions LIKE '%[SUGGEST]%paw-patrol%'
  AND instructions NOT LIKE '%dora:%';