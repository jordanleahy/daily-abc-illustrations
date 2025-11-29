-- Fix Shapes agent character theme selection to use [SUGGEST] blocks
UPDATE agents
SET 
  instructions = REPLACE(
    instructions,
    E'**Step 1: Character Theme Selection**\n\nPresent theme options in this exact format:\n```json\n{\n  "around-the-mountain": "🏔️ Around the Mountain",\n  "snowboarding": "🏂 Snowboarding",\n  "paw-patrol": "🐾 Paw Patrol",\n  "frozen": "❄️ Frozen",\n  "bluey": "🐶 Bluey",\n  "peppa-pig": "🐷 Peppa Pig",\n  "no-theme": "📚 Classic Shapes",\n  "custom": "✏️ Custom"\n}\n```',
    E'**Step 1: Character Theme Selection**\n\nPresent character theme options using this exact format:\n\n[SUGGEST]\naround-the-mountain: 🏔️ Around the Mountain\nsnowboarding: 🏂 Snowboarding\npaw-patrol: 🐾 Paw Patrol\nfrozen: ❄️ Frozen\nbluey: 🐶 Bluey\npeppa-pig: 🐷 Peppa Pig\nno-theme: 📚 Classic Shapes\ncustom: ✏️ Custom\n[/SUGGEST]'
  ),
  version_number = version_number + 1,
  what_changed = 'Fixed character theme selection to use [SUGGEST] blocks instead of JSON format for proper button rendering',
  updated_at = NOW()
WHERE type = 'book-creation-shapes' AND is_latest = true;