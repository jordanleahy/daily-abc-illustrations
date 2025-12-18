-- Add The Little Mermaid to character_themes table
INSERT INTO character_themes (id, display_name, thumbnail_url, alt_text, is_active, is_special, sort_order)
VALUES (
  'little-mermaid',
  'The Little Mermaid',
  '/themes/little-mermaid.png',
  'The Little Mermaid themed book',
  true,
  false,
  14
)
ON CONFLICT (id) DO NOTHING;

-- Add little-mermaid to all specialized book creation agents' theme [SUGGEST] blocks
-- Insert after dora in each agent's instructions
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  'dora: 🎒 Dora the Explorer
custom:',
  'dora: 🎒 Dora the Explorer
little-mermaid: 🧜‍♀️ The Little Mermaid
custom:'
),
updated_at = NOW()
WHERE is_latest = true 
  AND instructions LIKE '%dora:%' 
  AND instructions LIKE '%[SUGGEST]%paw-patrol%'
  AND instructions NOT LIKE '%little-mermaid:%';