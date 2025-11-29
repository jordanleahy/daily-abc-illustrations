-- Fix Numbers agent to use [SUGGEST] blocks
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '**Step 1: Character Theme Selection** (IMMEDIATE - First thing after book type selection)
"Perfect! Let''s create a Numbers book together! 🔢

First, let''s pick a character theme:"

```json',
  '**Step 1: Character Theme Selection** (IMMEDIATE AFTER BOOK TYPE)

First, let''s pick a character theme to make your book extra special:

[SUGGEST]
paw-patrol: 🐾 Paw Patrol
frozen: ❄️ Frozen
peppa-pig: 🐷 Peppa Pig
bluey: 🐶 Bluey
cocomelon: 🎵 CoComelon
moana: 🌺 Moana
mickey-mouse: 🐭 Mickey Mouse
mario: 🍄 Mario
sesame-street: 🎪 Sesame Street
benji-davies: 🎨 Benji Davies Style
black-and-white: ⚫ Black & White
bear-stories: 🐻 Bear Stories
custom: ✏️ Custom Theme
no-theme: 📚 No Theme
[/SUGGEST]'
)
WHERE type = 'book-creation-numbers' AND is_latest = true;