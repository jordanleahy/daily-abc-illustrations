-- Update ABC agent to reference curated item pools
UPDATE agents
SET 
  instructions = REGEXP_REPLACE(
    instructions,
    '\*\*Step 4: Subject Theme Discovery\*\*.*?\[/SUGGEST\]',
    E'**Step 4: Subject Theme Discovery**\n"What would you like each letter to feature?"\n\n[SUGGEST]\naround-the-mountain: 🏔️ Around the Mountain A-Z\nsnowboarding: 🏂 Snowboarding A-Z\nanimals: 🐾 Animals A-Z\nfood: 🍎 Food & Fruits A-Z\nnature: 🌳 Nature A-Z\nvehicles: 🚗 Things That Go A-Z\nmixed: 🎨 Classic Mixed Objects\ncustom: ✏️ Custom Theme\n[/SUGGEST]\n\n**IMPORTANT**: Once a subject theme is selected, you will receive a CURATED ITEMS REFERENCE list in your system context. This list contains 2-3 pre-approved options for each letter (A-Z). You MUST select items ONLY from this curated list to maintain quality and age-appropriateness. For each letter, choose the option that best fits the child\'s age and the character theme integration.',
    'gns'
  ),
  updated_at = now()
WHERE type = 'book-creation-abc'
  AND is_latest = true;